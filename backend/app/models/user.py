from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    username = Column(String(50), unique=True, nullable=False, index=True)
    password = Column(String(255), nullable=False)
    role = Column(String(20), nullable=False)  # owner | admin | kasir
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    sales = relationship("Sale", back_populates="user")
    purchases = relationship("Purchase", back_populates="created_by_user")
    stock_movements = relationship("StockMovement", back_populates="created_by_user")
    activity_logs = relationship("ActivityLog", back_populates="user")
