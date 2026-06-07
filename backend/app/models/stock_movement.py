from sqlalchemy import Column, Integer, String, Text, Date, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class StockMovement(Base):
    __tablename__ = "stock_movements"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    type = Column(String(20), nullable=False)  # in | out | opname
    qty = Column(Integer, nullable=False)
    reference_id = Column(Integer, nullable=True)
    reference_type = Column(String(50), nullable=True)  # purchase | sale | opname
    note = Column(Text, nullable=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    date = Column(Date, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    product = relationship("Product", back_populates="stock_movements")
    created_by_user = relationship("User", back_populates="stock_movements")
