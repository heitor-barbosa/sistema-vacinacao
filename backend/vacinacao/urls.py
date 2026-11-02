from rest_framework.routers import SimpleRouter

from .views import AgendaViewSet, VacinaViewSet

router = SimpleRouter()
router.register("vacinas", VacinaViewSet)
router.register("agendas", AgendaViewSet)
urlpatterns = router.urls
