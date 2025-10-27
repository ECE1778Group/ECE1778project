from dataclasses import dataclass

@dataclass
class Product:
    title: str
    description: str
    price: float
    picture_url: str
    category: str
    seller_username: str
    seller_name: str
    quantity: int
