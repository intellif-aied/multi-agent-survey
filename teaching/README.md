# Learning Site

Serve the AgentTeams lessons and their linked source files with Nginx:

The source-backed links expect `AgentTeams`, `AgentSpace`, `houmao`, `omnigent`,
and this `multi-agent-survey` checkout to be sibling directories under the same
`playground/` directory. The survey repository stores the report artifacts, not
copies of all four source repositories.

```bash
docker compose -f teaching/compose.yaml up -d
```

Open `http://<host-lan-ip>:18089/` from another machine on the LAN, or
<http://127.0.0.1:18089/> on the host itself.

To use another host port:

```bash
LEARNING_HTTP_PORT=19089 docker compose -f teaching/compose.yaml up -d
```

The default bind address is `0.0.0.0`. To restrict it to a particular LAN
interface or back to localhost, set `LEARNING_BIND_ADDRESS`:

```bash
LEARNING_BIND_ADDRESS=192.168.1.20 docker compose -f teaching/compose.yaml up -d
LEARNING_BIND_ADDRESS=127.0.0.1 docker compose -f teaching/compose.yaml up -d
```

The project-scoped Compose bridge intentionally has no fixed subnet or static
container IP. Docker IPAM selects an unused range to reduce conflicts with
existing Docker and host networks.

Stop the site without deleting lesson files:

```bash
docker compose -f teaching/compose.yaml down
```
