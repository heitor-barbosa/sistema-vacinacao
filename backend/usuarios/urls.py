from django.urls import path

from .views import (
    AlergiaDetailAPIView,
    AlergiaListCreateAPIView,
    UsuarioDetailAPIView,
    UsuarioListCreateAPIView,
)

urlpatterns = [
    path("alergias/", AlergiaListCreateAPIView.as_view(), name="alergia-list"),
    path("alergias/<int:pk>/", AlergiaDetailAPIView.as_view(), name="alergia-detail"),
    path("usuarios/", UsuarioListCreateAPIView.as_view(), name="usuario-list"),
    path("usuarios/<int:pk>/", UsuarioDetailAPIView.as_view(), name="usuario-detail"),
]
