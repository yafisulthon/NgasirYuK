"""
Seed script untuk mengisi data awal NgasirYuK.
Jalankan: python seed.py
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal, engine
from app.models import User, Category, Supplier, Product
from app.database import Base
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def seed():
    # Buat semua tabel
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # ─── Users ──────────────────────────────────────────────────────────
        if db.query(User).count() == 0:
            users = [
                User(name="Pemilik Toko", username="owner", password=pwd_context.hash("owner123"), role="owner"),
                User(name="Admin Toko", username="admin", password=pwd_context.hash("admin123"), role="admin"),
                User(name="Kasir Satu", username="kasir", password=pwd_context.hash("kasir123"), role="kasir"),
            ]
            db.add_all(users)
            print("✅ Users seeded (owner/owner123, admin/admin123, kasir/kasir123)")

        # ─── Categories ─────────────────────────────────────────────────────
        if db.query(Category).count() == 0:
            categories = [
                Category(name="Semen", description="Berbagai jenis semen bangunan"),
                Category(name="Pasir", description="Pasir bangunan dan pasir halus"),
                Category(name="Batu", description="Batu bata, batu kali, batu split"),
                Category(name="Cat", description="Cat tembok, cat kayu, cat besi"),
                Category(name="Besi", description="Besi beton, besi hollow, kawat"),
                Category(name="Keramik", description="Keramik lantai dan dinding"),
                Category(name="Pipa", description="Pipa PVC, pipa galvanis"),
                Category(name="Alat", description="Peralatan bangunan"),
            ]
            db.add_all(categories)
            print("✅ Categories seeded (8 kategori)")

        # ─── Suppliers ──────────────────────────────────────────────────────
        if db.query(Supplier).count() == 0:
            suppliers = [
                Supplier(name="PT Semen Gresik", address="Jl. Makmur No. 1, Gresik", phone="031-1234567", email="sgresik@email.com"),
                Supplier(name="CV Bahan Bangunan Jaya", address="Jl. Raya Industri No. 5, Surabaya", phone="031-7654321", email="bbjaya@email.com"),
                Supplier(name="UD Toko Besi Maju", address="Jl. Pahlawan No. 12, Sidoarjo", phone="031-9876543", email="besimaju@email.com"),
            ]
            db.add_all(suppliers)
            db.flush()
            print("✅ Suppliers seeded (3 supplier)")

            # ─── Sample Products ─────────────────────────────────────────────
            if db.query(Product).count() == 0:
                cat_semen = db.query(Category).filter(Category.name == "Semen").first()
                cat_besi = db.query(Category).filter(Category.name == "Besi").first()
                cat_cat = db.query(Category).filter(Category.name == "Cat").first()
                cat_keramik = db.query(Category).filter(Category.name == "Keramik").first()
                sup1 = db.query(Supplier).filter(Supplier.name == "PT Semen Gresik").first()
                sup2 = db.query(Supplier).filter(Supplier.name == "CV Bahan Bangunan Jaya").first()
                sup3 = db.query(Supplier).filter(Supplier.name == "UD Toko Besi Maju").first()

                products = [
                    Product(code="SMN-001", name="Semen Gresik 50kg", category_id=cat_semen.id, supplier_id=sup1.id, unit="sak", purchase_price=55000, selling_price=65000, stock=100, minimum_stock=20),
                    Product(code="SMN-002", name="Semen Tiga Roda 50kg", category_id=cat_semen.id, supplier_id=sup1.id, unit="sak", purchase_price=54000, selling_price=64000, stock=80, minimum_stock=20),
                    Product(code="BSI-001", name="Besi Beton 10mm", category_id=cat_besi.id, supplier_id=sup3.id, unit="pcs", purchase_price=45000, selling_price=55000, stock=200, minimum_stock=50),
                    Product(code="BSI-002", name="Besi Beton 8mm", category_id=cat_besi.id, supplier_id=sup3.id, unit="pcs", purchase_price=32000, selling_price=40000, stock=150, minimum_stock=50),
                    Product(code="CAT-001", name="Cat Tembok Dulux 5L", category_id=cat_cat.id, supplier_id=sup2.id, unit="pcs", purchase_price=120000, selling_price=145000, stock=30, minimum_stock=10),
                    Product(code="CAT-002", name="Cat Besi Glotex 1L", category_id=cat_cat.id, supplier_id=sup2.id, unit="pcs", purchase_price=45000, selling_price=58000, stock=5, minimum_stock=10),
                    Product(code="KRM-001", name="Keramik Lantai 40x40", category_id=cat_keramik.id, supplier_id=sup2.id, unit="pcs", purchase_price=8500, selling_price=12000, stock=500, minimum_stock=100),
                ]
                db.add_all(products)
                print("✅ Products seeded (7 produk sample)")

        db.commit()
        print("\n🎉 Seed data berhasil! Sistem NgasirYuK siap digunakan.")
        print("\nDefault login:")
        print("  Owner:  username=owner  | password=owner123")
        print("  Admin:  username=admin  | password=admin123")
        print("  Kasir:  username=kasir  | password=kasir123")

    except Exception as e:
        db.rollback()
        print(f"❌ Error saat seeding: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
