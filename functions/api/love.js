async function checkRateLimit( request, env ) {
	const ip = request.headers.get( 'CF-Connecting-IP' );
	if( !ip ) return true;
	const rateLimitKey = `ratelimit_${ip}`;
	const lastRequest = await env.LOVE_COUNTS.get( rateLimitKey );
	if( lastRequest ) {
		const timeSince = Date.now() - parseInt( lastRequest );
		if( timeSince < 1000 ) {
			return false;
		}
	}
	await env.LOVE_COUNTS.put( rateLimitKey, Date.now().toString(), { expirationTtl: 60 } );
	return true;
}
export async function onRequestGet( { request, env } ) {
	const url = new URL( request.url );
	const targetUrl = url.searchParams.get( 'url' );
	if( !targetUrl ) {
		return new Response( JSON.stringify( { error: 'Missing url parameter' } ), {
			status: 400,
			headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
		} );
	}
	const count = await env.LOVE_COUNTS.get( targetUrl );
	return new Response( JSON.stringify( { count: count ? parseInt( count ) : 0 } ), {
		headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
	} );
}
export async function onRequestPost( { request, env } ) {
	const allowed = await checkRateLimit( request, env );
	if( !allowed ) {
		return new Response( JSON.stringify( { error: 'Rate limit exceeded' } ), {
			status: 429,
			headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
		} );
	}
	try {
		const body = await request.json();
		const { url, action } = body;
		if( !url || !action ) {
			return new Response( JSON.stringify( { error: 'Missing url or action' } ), {
				status: 400,
				headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
			} );
		}
		if( action !== 'like' && action !== 'unlike' ) {
			return new Response( JSON.stringify( { error: 'Invalid action' } ), {
				status: 400,
				headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
			} );
		}
		const currentCount = await env.LOVE_COUNTS.get( url );
		let newCount = currentCount ? parseInt( currentCount ) : 0;
		if( action === 'like' ) {
			newCount++;
		} else if( action === 'unlike' && newCount > 0 ) {
			newCount--;
		}
		await env.LOVE_COUNTS.put( url, newCount.toString() );
		return new Response( JSON.stringify( { count: newCount } ), {
			headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
		} );
	} catch( e ) {
		return new Response( JSON.stringify( { error: 'Invalid request' } ), {
			status: 400,
			headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
		} );
	}
}
export async function onRequestOptions() {
	return new Response( null, {
		headers: {
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
			'Access-Control-Allow-Headers': 'Content-Type'
		}
	} );
}
