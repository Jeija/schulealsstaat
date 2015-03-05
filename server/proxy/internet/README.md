## Transaction proxy server (internet component)
This server has to be installed on a globally addressable internet domain and works as a backup for the intranet-only currency system. It does NOT decrypt any requests / transactions / etc.

It hands out requests it receives to any clients with an appropriate password (here called certificate). The certificate may be transferred over an insecure connection. If it got stolen, an attacker could
potentially retrieve queries from the server, but still would need the key to decrypt them.
However, an attacker could spoof error answers to the clients. Since all success answers are encrypted,
these cannot be faked.

It accepts requests on TCP port 1337 over a HTTP connection at url:
{server}:{1337}:/action/*
It will respond with HTTP status code 200 at url:
{server}:{1337}:/ping

It responds with a JSON-encoded list of received requests at url:
{server}:{1381}:/getActions
This response will only include those requests that were not already sent and has the format:
{
	id (Number that makes this specific transaction distinguishable) : {
		action : name of action as supplied in URL {server}:{1337}:/action/NAME,
		request : Original encrypted request,
	}
}

Responses to the requests can be POSTed at:
{server}:{1381}:putResponse/{id}/
