(function() {
	'use strict';
	const API_URL = 'https://bttn.love/api/love';
	const HEART_SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="love-heart"><path d="M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5"/></svg>';
	const CSS = `
		.love-button{display:inline-flex;flex-direction:column;align-items:center;gap:2px;font-size:14px;color:inherit;text-decoration:none;padding:4px 8px;border:none;background:none;transition:transform .1s ease;cursor:pointer}
		.love-button:hover, .love-button:focus{transform:scale(1.05)}
		.love-button:active{transform:scale(0.95)}
		.love-button svg{transition:all .3s ease}
		.love-button.loved svg{animation:love-pop .3s ease}
		.love-count{min-width:1ch;font-weight:500;text-align:center}
		.love-count.zero{visibility:hidden}
		@keyframes love-pop{0%{transform:scale(1);}50%{transform:scale(1.3);}100%{transform:scale(1)}}
	`;
	function injectStyles() {
		if ( document.getElementById( 'love-button-styles' ) ) return;
		const style = document.createElement( 'style' );
		style.id = 'love-button-styles';
		style.textContent = CSS;
		document.head.appendChild( style );
	}
	function normalizeUrl( url ) {
		try {
			const parsed = new URL( url );
			let path = parsed.pathname + parsed.search + parsed.hash;
			if ( path === '/' ) path = '';
			return parsed.hostname.replace( /^www\./, '' ) + path;
		} catch( e ) {
			return url;
		}
	}
	function getTargetUrl( button ) {
		const href = button.getAttribute( 'href' );
		if ( !href || href === '#' || href === '' ) {
			return normalizeUrl( window.location.href );
		}
		if ( href.startsWith( 'http' ) ) {
			return normalizeUrl( href );
		}
		return normalizeUrl( window.location.origin + ( href.startsWith( '/' ) ? href : '/' + href ) );
	}
	function getSessionKey( url ) {
		return 'love_' + url;
	}
	function isLoved( url ) {
		return sessionStorage.getItem( getSessionKey( url ) ) === '1';
	}
	function setLoved( url, loved ) {
		if ( loved ) {
			sessionStorage.setItem( getSessionKey( url ), '1' );
		} else {
			sessionStorage.removeItem( getSessionKey( url ) );
		}
	}
	async function fetchCount( url ) {
		try {
			const response = await fetch( API_URL + '?url=' + encodeURIComponent( url ) );
			const data = await response.json();
			return data.count || 0;
		} catch( e ) {
			return 0;
		}
	}
	async function updateCount( url, action ) {
		try {
			const response = await fetch( API_URL, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify( { url, action } )
			} );
			const data = await response.json();
			return data.count || 0;
		} catch( e ) {
			return null;
		}
	}
	function formatCount( count ) {
		if ( count >= 1000000 ) return ( count / 1000000 ).toFixed( 1 ).replace( /\.0$/, '' ) + 'm';
		if ( count >= 1000 ) return ( count / 1000 ).toFixed( 1 ).replace( /\.0$/, '' ) + 'k';
		return count > 0 ? String( count ) : '0';
	}
	function updateButton( button, count, loved ) {
		const countEl = button.querySelector( '.love-count' );
		if ( !countEl ) {
			const span = document.createElement( 'span' );
			span.className = 'love-count';
			span.textContent = formatCount( count );
			span.classList.toggle( 'zero', count === 0 );
			button.insertBefore( span, button.firstChild );
		} else {
			countEl.textContent = formatCount( count );
			countEl.classList.toggle( 'zero', count === 0 );
		}
		button.title = loved ? 'Unlike' : 'Like';
		button.setAttribute( 'aria-label', loved ? 'Unlike' : 'Like' );
		button.setAttribute( 'aria-pressed', loved ? 'true' : 'false' );
		button.classList.toggle( 'loved', loved );
		button.querySelectorAll( 'svg' ).forEach( svg => {
			svg.style.fill = loved ? 'currentColor' : 'none';
		} );
	}
	async function handleClick( e, button ) {
		e.preventDefault();
		if ( button.dataset.inFlight ) return;
		button.dataset.inFlight = '1';
		const url = getTargetUrl( button );
		const currentlyLoved = isLoved( url );
		const action = currentlyLoved ? 'unlike' : 'like';
		const newCount = await updateCount( url, action );
		delete button.dataset.inFlight;
		if ( newCount !== null ) {
			setLoved( url, !currentlyLoved );
			updateButton( button, newCount, !currentlyLoved );
		}
	}
	async function initButton( button ) {
		button.setAttribute( 'role', 'button' );
		const url = getTargetUrl( button );
		if ( button.children.length === 0 && button.textContent.trim() === '' ) {
			button.innerHTML = '<span class="love-count zero">0</span>' + HEART_SVG;
		}
		const count = await fetchCount( url );
		const loved = isLoved( url );
		updateButton( button, count, loved );
		button.addEventListener( 'click', ( e ) => handleClick( e, button ) );
		button.addEventListener( 'keydown', ( e ) => {
			if ( e.key === ' ' ) {
				e.preventDefault();
				handleClick( e, button );
			}
		} );
	}
	function init() {
		injectStyles();
		const buttons = document.querySelectorAll( '.love-button' );
		buttons.forEach( initButton );
	}
	if ( document.readyState === 'loading' ) {
		document.addEventListener( 'DOMContentLoaded', init );
	} else {
		init();
	}
})();