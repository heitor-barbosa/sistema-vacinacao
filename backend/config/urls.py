from django.urls import include, path

urlpatterns = [
    path("api/", include("usuarios.urls")),
    path("api/", include("vacinacao.urls")),
]
