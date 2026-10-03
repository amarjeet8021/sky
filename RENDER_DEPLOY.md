# Render Quick Deploy

1. Upload this complete folder to a GitHub repository.
2. Render -> New -> Blueprint.
3. Select the repository.
4. Render detects `render.yaml`.
5. Enter a strong `JWT_SECRET` when prompted.
6. Deploy.
7. Open the generated `onrender.com` URL.

If you don't want a persistent disk, remove the disk section and set DATA_DIR to `./data`, but SQLite data can then disappear after redeploy/restart. For real production traffic, use PostgreSQL.
