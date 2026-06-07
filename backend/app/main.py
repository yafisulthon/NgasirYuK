from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.routers.auth import router as auth_router
from app.routers.users import router as users_router
from app.routers.master import categories_router, suppliers_router
from app.routers.products import router as products_router
from app.routers.purchases import router as purchases_router
from app.routers.sales import router as sales_router
from app.routers.inventory import inventory_router, logs_router
from app.routers.reports import router as reports_router

app = FastAPI(
    title="NgasirYuK API",
    description="Backend API untuk Sistem Informasi Kasir dan Manajemen Persediaan Toko Material",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# ─── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Routers ───────────────────────────────────────────────────────────────────
app.include_router(auth_router)
app.include_router(users_router)
app.include_router(categories_router)
app.include_router(suppliers_router)
app.include_router(products_router)
app.include_router(purchases_router)
app.include_router(sales_router)
app.include_router(inventory_router)
app.include_router(logs_router)
app.include_router(reports_router)


@app.get("/")
def root():
    return {"message": f"Selamat datang di {settings.APP_NAME} API 🚀", "version": "1.0.0"}


@app.get("/health")
def health():
    return {"status": "ok"}
