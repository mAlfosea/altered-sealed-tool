# Déploiement sur un serveur Linux avec Docker

## Prérequis

- Docker et Docker Compose installés sur le serveur
- Accès SSH au serveur

## Déploiement rapide

```bash
# Cloner le dépôt (ou mettre à jour)
git clone https://github.com/mAlfosea/altered-sealed-tool.git
cd altered-sealed-tool

# Build et lancer en arrière-plan
docker compose up -d --build

# L’app est accessible sur http://<IP_SERVEUR>:3000
```

## Mise à jour

```bash
cd altered-sealed-tool
git pull
docker compose up -d --build
```

## Commandes utiles

```bash
# Voir les logs
docker compose logs -f app

# Arrêter
docker compose down

# Rebuild sans cache (si souci de build)
docker compose build --no-cache && docker compose up -d
```

## Exposer sur le port 80

Si tu veux servir l’app sur le port 80 sans reverse proxy, dans `docker-compose.yml` :

```yaml
ports:
  - "80:3000"
```

Sinon, place un reverse proxy (Nginx ou Caddy) devant le conteneur et laisse `3000:3000` ; le proxy écoute sur 80/443 et redirige vers `localhost:3000`.
