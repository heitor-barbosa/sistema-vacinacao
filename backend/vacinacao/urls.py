from django.urls import path

from .views import (
    AgendaBaixaAPIView,
    AgendaDetailAPIView,
    AgendaHojeAPIView,
    AgendaListCreateAPIView,
    VacinaDetailAPIView,
    VacinaListCreateAPIView,
)

urlpatterns = [
    path("vacinas/", VacinaListCreateAPIView.as_view(), name="vacina-list"),
    path("vacinas/<int:pk>/", VacinaDetailAPIView.as_view(), name="vacina-detail"),
    path("agendas/", AgendaListCreateAPIView.as_view(), name="agenda-list"),
    path("agendas/hoje/", AgendaHojeAPIView.as_view(), name="agenda-hoje"),
    path("agendas/<int:pk>/", AgendaDetailAPIView.as_view(), name="agenda-detail"),
    path("agendas/<int:pk>/baixa/", AgendaBaixaAPIView.as_view(), name="agenda-baixa"),
]
