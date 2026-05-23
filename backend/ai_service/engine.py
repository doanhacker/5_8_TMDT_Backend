from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Dict, Iterable, List
import math
import re
import unicodedata


def strip_vietnamese(text: str) -> str:
    normalized = unicodedata.normalize("NFD", str(text or ""))
    without_marks = "".join(char for char in normalized if unicodedata.category(char) != "Mn")
    return without_marks.replace("đ", "d").replace("Đ", "D").lower()


def parse_numeric(text: str) -> float:
    match = re.search(r"(\d+(?:[.,]\d+)?)", str(text or ""))
    if not match:
        return 0.0
    return float(match.group(1).replace(",", "."))


def clamp(value: float, minimum: float = 0.0, maximum: float = 1.0) -> float:
    return max(minimum, min(maximum, value))


def format_currency(value: float) -> str:
    return f"{int(round(value)):,.0f}".replace(",", ".") + "đ"


def tokenize(text: str) -> List[str]:
    normalized = strip_vietnamese(text)
    return re.findall(r"[a-z0-9]+", normalized)


def count_overlap(tokens_a: Iterable[str], tokens_b: Iterable[str]) -> int:
    set_a = set(tokens_a)
    set_b = set(tokens_b)
    return len(set_a & set_b)


@dataclass
class ProductRecord:
    product_id: str
    name: str
    brand: str
    category: str
    price: float
    ram_gb: float
    storage_gb: float
    cpu: str
    gpu: str
    config: str
    specs: str
    in_stock: bool
    has_ai: bool

    @property
    def text_blob(self) -> str:
        return " ".join(
            [
                self.name,
                self.brand,
                self.category,
                self.cpu,
                self.gpu,
                self.config,
                self.specs,
            ]
        )

    @property
    def tokens(self) -> List[str]:
        return tokenize(self.text_blob)


class QueryAnalyzer:
    PRODUCT_SIGNALS = [
        "laptop",
        "may",
        "gaming",
        "van phong",
        "sinh vien",
        "lap trinh",
        "do hoa",
        "mong nhe",
        "ram",
        "ssd",
        "cpu",
        "gpu",
        "card roi",
        "gia",
        "ngan sach",
        "trieu",
        "rtx",
        "i5",
        "i7",
        "ryzen",
    ]

    def analyze(self, message: str, history: List[Dict[str, Any]]) -> Dict[str, Any]:
        current = strip_vietnamese(message)
        prior_user_text = " ".join(
            strip_vietnamese(str(item.get("content", "")))
            for item in history
            if str(item.get("role", "")).lower() == "user"
        )
        merged = f"{prior_user_text} {current}".strip()

        intents = {
            "gaming": self._has_any(merged, ["gaming", "choi game", "fps", "valorant", "cs2", "lol", "dota", "genshin"]),
            "office": self._has_any(merged, ["van phong", "word", "excel", "powerpoint", "ke toan", "lam viec"]),
            "student": self._has_any(merged, ["sinh vien", "hoc sinh", "hoc tap", "di hoc"]),
            "programming": self._has_any(merged, ["lap trinh", "code", "developer", "devops", "cntt", "it"]),
            "design": self._has_any(merged, ["do hoa", "thiet ke", "video", "editing", "premiere", "photoshop", "3d", "autocad", "render"]),
            "portable": self._has_any(merged, ["mong nhe", "de mang", "di chuyen", "nhe"]),
            "ai": self._has_any(merged, [" ai ", "tri tue nhan tao", "copilot", "npu"]),
        }

        social = {
            "greeting": self._is_greeting(current),
            "thanks": self._is_thanks(current),
            "goodbye": self._is_goodbye(current),
        }

        query_tokens = tokenize(merged)
        budget = self._extract_budget(merged)
        min_ram = self._extract_minimum(merged, ["ram"])
        min_storage = self._extract_minimum(merged, ["ssd", "storage", "bo nho", "o cung"])
        has_product_signal = self._has_any(merged, self.PRODUCT_SIGNALS) or any(intents.values()) or bool(budget) or min_ram > 0 or min_storage > 0

        return {
            "message": message,
            "normalized": current,
            "merged_context": merged,
            "query_tokens": query_tokens,
            "budget": budget,
            "min_ram": min_ram,
            "min_storage": min_storage,
            "premium_pref": self._has_any(merged, ["cao cap", "premium", "xin", "sang", "dep"]),
            "value_pref": self._has_any(merged, ["re", "tot nhat trong tam gia", "p/p", "gia tot", "tiet kiem"]),
            "intents": intents,
            "social": social,
            "has_product_signal": has_product_signal,
            "is_smalltalk_only": any(social.values()) and not has_product_signal,
            "history_depth": len(history),
        }

    def build_clarifying_questions(self, analysis: Dict[str, Any], top_score: float) -> List[str]:
        questions: List[str] = []
        active_intents = [label for label, active in analysis["intents"].items() if active]

        if not active_intents:
            questions.append("Bạn cần máy cho nhu cầu nào: gaming, học tập, lập trình hay văn phòng?")
        if not analysis["budget"]:
            questions.append("Ngân sách của bạn khoảng bao nhiêu?")
        if not analysis["min_ram"] and (analysis["intents"]["programming"] or analysis["intents"]["design"]):
            questions.append("Bạn muốn ưu tiên 16GB RAM hay 32GB RAM?")
        if not analysis["min_storage"] and (analysis["intents"]["gaming"] or analysis["intents"]["design"]):
            questions.append("Bạn cần SSD 512GB hay 256GB là đủ?")
        if analysis["intents"]["portable"] and top_score < 0.45:
            questions.append("Bạn ưu tiên mỏng nhẹ hay hiệu năng hơn?")

        return questions[:2]

    def _has_any(self, text: str, patterns: List[str]) -> bool:
        wrapped = f" {text} "
        return any(pattern in wrapped for pattern in patterns)

    def _is_greeting(self, text: str) -> bool:
        compact = text.strip()
        return compact in {
            "chao",
            "xin chao",
            "hello",
            "hi",
            "helo",
            "alo",
            "ad oi",
            "shop oi",
        }

    def _is_thanks(self, text: str) -> bool:
        return text.strip() in {"cam on", "thanks", "thank you", "tks", "ok cam on"}

    def _is_goodbye(self, text: str) -> bool:
        return text.strip() in {"tam biet", "bye", "goodbye", "hen gap lai"}

    def _extract_budget(self, text: str) -> float | None:
        text_budget = re.search(r"(\d+(?:[.,]\d+)?)\s*(tr|trieu|m|k|nghin)", text)
        if text_budget:
            number = float(text_budget.group(1).replace(",", "."))
            unit = text_budget.group(2)
            if unit in {"k", "nghin"}:
                return number * 1_000
            return number * 1_000_000

        raw_number = re.search(r"\b(\d{7,9})\b", text)
        if raw_number:
            return float(raw_number.group(1))
        return None

    def _extract_minimum(self, text: str, keywords: List[str]) -> float:
        pattern = re.compile(rf"(\d+)\s*(?:gb\s*)?(?:{'|'.join(keywords)})")
        match = pattern.search(text)
        return float(match.group(1)) if match else 0.0


class HybridRecommendationModel:
    def __init__(self, products: List[ProductRecord]) -> None:
        self.products = products

    def rank(self, analysis: Dict[str, Any]) -> List[Dict[str, Any]]:
        ranked: List[Dict[str, Any]] = []
        for product in self.products:
            text_score = self._text_score(product, analysis["query_tokens"])
            budget_score = self._budget_score(product.price, analysis["budget"], analysis["value_pref"], analysis["premium_pref"])
            spec_score = self._spec_score(product, analysis)
            intent_score = self._intent_score(product, analysis["intents"])
            stock_score = 1.0 if product.in_stock else 0.12
            final_score = (
                text_score * 0.34
                + budget_score * 0.18
                + spec_score * 0.16
                + intent_score * 0.22
                + stock_score * 0.10
            )
            ranked.append(
                {
                    "product": product,
                    "scores": {
                        "text": round(text_score, 4),
                        "budget": round(budget_score, 4),
                        "spec": round(spec_score, 4),
                        "intent": round(intent_score, 4),
                        "stock": round(stock_score, 4),
                        "final": round(final_score, 4),
                    },
                }
            )

        ranked.sort(key=lambda item: item["scores"]["final"], reverse=True)
        return ranked

    def _text_score(self, product: ProductRecord, query_tokens: List[str]) -> float:
        if not query_tokens:
            return 0.2

        product_tokens = product.tokens
        if not product_tokens:
            return 0.0

        overlap = count_overlap(query_tokens, product_tokens)
        overlap_score = overlap / max(len(set(query_tokens)), 1)

        weighted_hits = 0.0
        token_string = f" {' '.join(product_tokens)} "
        for token in set(query_tokens):
            if token in {"gaming", "office", "student", "programming", "design"}:
                continue
            if f" {token} " in token_string:
                weighted_hits += 1.0
            elif token in token_string:
                weighted_hits += 0.5

        weighted_score = weighted_hits / max(math.sqrt(len(set(query_tokens))), 1.0)
        return clamp((overlap_score * 0.7) + (weighted_score * 0.3))

    def _budget_score(self, price: float, budget: float | None, value_pref: bool, premium_pref: bool) -> float:
        if not budget or not price:
            return 0.58 if value_pref else 0.5
        if price <= budget:
            base = clamp(1 - ((budget - price) / max(budget, 1)) * (0.45 if value_pref else 0.28), 0.68, 1.0)
            if premium_pref and price >= budget * 0.82:
                base += 0.08
            return clamp(base)
        overspend_ratio = (price - budget) / budget
        penalty = 1.4 if premium_pref else 1.8
        return clamp(1 - overspend_ratio * penalty, 0.0, 0.72)

    def _spec_score(self, product: ProductRecord, analysis: Dict[str, Any]) -> float:
        score = 0.52
        if analysis["min_ram"] > 0:
            score += 0.24 if product.ram_gb >= analysis["min_ram"] else -0.36
        if analysis["min_storage"] > 0:
            score += 0.18 if product.storage_gb >= analysis["min_storage"] else -0.22
        return clamp(score)

    def _intent_score(self, product: ProductRecord, intents: Dict[str, bool]) -> float:
        text = strip_vietnamese(product.text_blob)
        gpu_rich = bool(re.search(r"rtx|gtx|radeon|geforce|quadro", text))
        premium_cpu = bool(re.search(r"i7|i9|ultra 7|ultra 9|ryzen 7|ryzen 9|apple m", text))
        score = 0.42

        if intents.get("gaming"):
            score += 0.22 if gpu_rich else -0.12
            score += 0.08 if product.ram_gb >= 16 else -0.05
        if intents.get("design"):
            score += 0.22 if gpu_rich else -0.10
            score += 0.12 if product.ram_gb >= 16 else -0.06
        if intents.get("programming"):
            score += 0.12 if premium_cpu else 0.02
            score += 0.10 if product.ram_gb >= 16 else -0.04
        if intents.get("office"):
            score += 0.12 if product.price <= 25_000_000 else -0.02
        if intents.get("student"):
            score += 0.14 if product.price <= 20_000_000 else -0.03
        if intents.get("portable"):
            score += 0.08 if parse_numeric(product.config) <= 15 else 0.0
        if intents.get("ai"):
            score += 0.16 if product.has_ai else 0.0
        return clamp(score)


class ResponseComposer:
    def compose(self, analysis: Dict[str, Any], ranked: List[Dict[str, Any]], clarifying_questions: List[str]) -> Dict[str, Any]:
        social = analysis["social"]
        if analysis["is_smalltalk_only"]:
            return self._social_response(social)

        top_score = ranked[0]["scores"]["final"] if ranked else 0.0
        if clarifying_questions and (not analysis["has_product_signal"] or top_score < 0.25):
            return {
                "answer": "Mình có thể tư vấn laptop theo nhu cầu và ngân sách của bạn.",
                "follow_up_questions": clarifying_questions[:1],
                "recommendations": [],
                "diagnostics": {
                    "confidence": "low",
                    "mode": "clarification",
                },
            }

        top_items = ranked[:3]
        answer = self._build_concise_answer(analysis, top_items)
        recommendations = [self._serialize_item(item) for item in top_items]
        follow_up = self._follow_up_prompts(analysis, top_items)

        return {
            "answer": answer,
            "follow_up_questions": follow_up,
            "recommendations": recommendations,
            "diagnostics": {
                "confidence": self._confidence(top_items),
                "mode": "ranking",
            },
        }

    def _social_response(self, social: Dict[str, bool]) -> Dict[str, Any]:
        if social["greeting"]:
            answer = "Xin chào. Tôi có thể tư vấn laptop theo nhu cầu, ngân sách hoặc cấu hình bạn muốn."
            suggestions = [
                "Laptop gaming tầm 25 triệu",
                "Laptop cho sinh viên dưới 15 triệu",
            ]
        elif social["thanks"]:
            answer = "Rất vui được hỗ trợ bạn. Khi cần tư vấn thêm, bạn cứ nhắn tôi."
            suggestions = []
        else:
            answer = "Cảm ơn bạn. Khi cần tư vấn laptop, bạn cứ quay lại nhé."
            suggestions = []

        return {
            "answer": answer,
            "follow_up_questions": suggestions,
            "recommendations": [],
            "diagnostics": {
                "confidence": "high",
                "mode": "social",
            },
        }

    def _build_concise_answer(self, analysis: Dict[str, Any], items: List[Dict[str, Any]]) -> str:
        if not items:
            return "Hiện tại tôi chưa tìm được mẫu phù hợp để đề xuất ngay."

        best = items[0]["product"]
        reasons = ", ".join(self._reasons(best)[:2])
        lead = self._build_lead(analysis)
        return f"{lead} Mẫu phù hợp nhất hiện tại là {best.name} vì {reasons}."

    def _build_lead(self, analysis: Dict[str, Any]) -> str:
        needs = []
        if analysis["intents"]["gaming"]:
            needs.append("gaming")
        if analysis["intents"]["office"]:
            needs.append("văn phòng")
        if analysis["intents"]["student"]:
            needs.append("sinh viên")
        if analysis["intents"]["programming"]:
            needs.append("lập trình")
        if analysis["intents"]["design"]:
            needs.append("đồ họa")
        if analysis["intents"]["portable"]:
            needs.append("mỏng nhẹ")
        if analysis["intents"]["ai"]:
            needs.append("AI")

        if needs and analysis["budget"]:
            return f"Dựa trên nhu cầu {', '.join(needs)} và ngân sách khoảng {format_currency(analysis['budget'])},"
        if needs:
            return f"Dựa trên nhu cầu {', '.join(needs)},"
        if analysis["budget"]:
            return f"Với ngân sách khoảng {format_currency(analysis['budget'])},"
        return "Dựa trên thông tin bạn cung cấp,"

    def _serialize_item(self, item: Dict[str, Any]) -> Dict[str, Any]:
        product: ProductRecord = item["product"]
        return {
            "id": product.product_id,
            "name": product.name,
            "price": format_currency(product.price),
            "config": product.config or product.specs or "Đang cập nhật",
            "reasons": self._reasons(product),
            "tradeoffs": self._tradeoffs(product),
            "score": int(round(item["scores"]["final"] * 100)),
        }

    def _reasons(self, product: ProductRecord) -> List[str]:
        reasons: List[str] = []
        text = strip_vietnamese(product.text_blob)
        if re.search(r"rtx|gtx|radeon|geforce|quadro", text):
            reasons.append("có GPU rời")
        if product.ram_gb >= 16:
            reasons.append(f"RAM {int(product.ram_gb)}GB")
        if product.storage_gb >= 512:
            reasons.append(f"SSD {int(product.storage_gb)}GB")
        if product.in_stock:
            reasons.append("đang còn hàng")
        return reasons[:3] or ["phù hợp với nhu cầu bạn đang hỏi"]

    def _tradeoffs(self, product: ProductRecord) -> List[str]:
        notes: List[str] = []
        if product.ram_gb < 16:
            notes.append("RAM dưới 16GB sẽ hạn chế khi đa nhiệm nặng")
        if product.storage_gb < 512:
            notes.append("SSD dưới 512GB có thể nhanh đầy")
        if not re.search(r"rtx|gtx|radeon|geforce|quadro", strip_vietnamese(product.text_blob)):
            notes.append("thiên về cân bằng hơn là hiệu năng đồ họa mạnh")
        return notes[:2]

    def _follow_up_prompts(self, analysis: Dict[str, Any], items: List[Dict[str, Any]]) -> List[str]:
        prompts: List[str] = []
        if not analysis["budget"]:
            prompts.append("Bạn muốn mình lọc theo ngân sách nào?")
        elif analysis["intents"]["gaming"] and not analysis["min_storage"]:
            prompts.append("Bạn có muốn ưu tiên SSD 512GB trở lên không?")
        elif analysis["intents"]["programming"] and not analysis["min_ram"]:
            prompts.append("Bạn muốn ưu tiên 16GB RAM hay 32GB RAM?")
        elif len(items) > 1:
            prompts.append(f"Tôi có thể so sánh nhanh {items[0]['product'].name} và {items[1]['product'].name} nếu bạn muốn.")
        return prompts[:1]

    def _confidence(self, items: List[Dict[str, Any]]) -> str:
        if not items:
            return "low"
        score = items[0]["scores"]["final"]
        if score >= 0.65:
            return "high"
        if score >= 0.38:
            return "medium"
        return "low"


class LaptopShopDeepAI:
    def __init__(self) -> None:
        self.analyzer = QueryAnalyzer()
        self.composer = ResponseComposer()

    def chat(self, message: str, products: List[Dict[str, Any]], history: List[Dict[str, Any]] | None = None) -> Dict[str, Any]:
        history = history or []
        records = [self._to_record(item) for item in products if item.get("id") and item.get("name")]

        if not records:
            return {
                "answer": "Hiện tại tôi chưa nhận được dữ liệu sản phẩm để phân tích.",
                "follow_up_questions": [],
                "recommendations": [],
                "diagnostics": {
                    "confidence": "low",
                    "mode": "no_catalog",
                    "algorithm": "hybrid_keyword_structured_ranker_v4",
                },
            }

        analysis = self.analyzer.analyze(message, history)
        model = HybridRecommendationModel(records)
        ranked = model.rank(analysis)
        top_score = ranked[0]["scores"]["final"] if ranked else 0.0
        clarifying_questions = self.analyzer.build_clarifying_questions(analysis, top_score)
        payload = self.composer.compose(analysis, ranked, clarifying_questions)
        payload["diagnostics"]["algorithm"] = "hybrid_keyword_structured_ranker_v4"
        payload["diagnostics"]["catalog_size"] = len(records)
        payload["diagnostics"]["history_depth"] = len(history)
        payload["analysis"] = {
            "budget": analysis["budget"],
            "min_ram": analysis["min_ram"],
            "min_storage": analysis["min_storage"],
            "intents": analysis["intents"],
            "social": analysis["social"],
            "has_product_signal": analysis["has_product_signal"],
        }
        return payload

    def _to_record(self, item: Dict[str, Any]) -> ProductRecord:
        return ProductRecord(
            product_id=str(item.get("id", "")),
            name=str(item.get("name", "")),
            brand=str(item.get("brand", "")),
            category=str(item.get("series", "")),
            price=float(item.get("price", 0) or 0),
            ram_gb=parse_numeric(str(item.get("ram", ""))),
            storage_gb=parse_numeric(str(item.get("storage", ""))),
            cpu=str(item.get("cpu", "")),
            gpu=str(item.get("graphics", "")),
            config=str(item.get("config", "")),
            specs=str(item.get("specs", "")),
            in_stock=bool(item.get("inStock", False)),
            has_ai=bool(item.get("hasAI", False)),
        )
