from dataclasses import dataclass

@dataclass
class Seller:
    username: str
    name: str
    description: str|None
