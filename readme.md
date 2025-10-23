# Love Button (love.js)

This is a simple, privacy-friendly solution/replacement for the "Like Button" with persistent like counts (stored centrally for any URL).

## Default Usage

Add to header or footer of your website:

`<script src="https://lovers.pages.dev/love.js"></script>`

Add anywhere on your webpages:

`<a class="love-button"></a>`

Look up counts for existing URLs:

`https://lovers.pages.dev/api/love?url=https://example.com/`

## Custom Usage

Specify the URL (including query or hashtag) and set custom button content (including text, image, svg, or emoji):

`<a href="https://example.com/#test" class="love-button">👍</a>`

### Recommended Icons

[https://lucide.dev/](https://lucide.dev/)

## License

Public Domain

## Privacy

love.js does not have any analytics or tracking. When someone likes/unlikes, IPs are never logged, but are briefly held in memory for the purpose of abuse mitigation (rate-limiting). The service is hosted on [Cloudflare](https://www.cloudflare.com/privacypolicy/).