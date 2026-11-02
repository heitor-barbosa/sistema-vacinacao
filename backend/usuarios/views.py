from rest_framework import generics

from .models import Alergia, Usuario
from .serializers import AlergiaSerializer, UsuarioSerializer


class AlergiaListCreateAPIView(generics.ListCreateAPIView):
    queryset = Alergia.objects.all()
    serializer_class = AlergiaSerializer


class AlergiaDetailAPIView(generics.RetrieveDestroyAPIView):
    queryset = Alergia.objects.all()
    serializer_class = AlergiaSerializer


class UsuarioListCreateAPIView(generics.ListCreateAPIView):
    queryset = Usuario.objects.prefetch_related("alergias")
    serializer_class = UsuarioSerializer


class UsuarioDetailAPIView(generics.RetrieveDestroyAPIView):
    queryset = Usuario.objects.prefetch_related("alergias")
    serializer_class = UsuarioSerializer
