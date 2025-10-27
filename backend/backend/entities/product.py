from dataclasses import dataclass

@dataclass
class Product:
    id: str
    title: str
    description: str
    price: float
    picture_url: str
    category: str
    seller_id: str
    seller_name: str
    quantity: int
