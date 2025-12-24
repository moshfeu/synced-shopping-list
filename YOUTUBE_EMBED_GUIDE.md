# YouTube Video Embed Guide

## Fixing Error 153 (Video Player Configuration Error)

If you're embedding YouTube tutorial videos for this project and encountering **Error 153: Video player configuration error**, follow these guidelines:

### Proper Iframe Configuration

Use this template for embedding YouTube videos:

```html
<iframe 
  width="560" 
  height="315" 
  src="https://www.youtube-nocookie.com/embed/VIDEO_ID?enablejsapi=1" 
  title="YouTube video player" 
  frameborder="0" 
  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
  referrerpolicy="strict-origin-when-cross-origin" 
  allowfullscreen>
</iframe>
```

### Key Points to Avoid Error 153:

1. **Use `youtube-nocookie.com`** instead of `youtube.com` for better privacy and fewer CORS issues
2. **Add `?enablejsapi=1`** parameter to the video URL
3. **Include proper `allow` attributes** for iframe permissions
4. **Set `referrerpolicy`** to handle cross-origin requests properly
5. **Ensure the video allows embedding** - check the video settings on YouTube

### Example:

For video ID `ABC123XYZ`, use:
```
https://www.youtube-nocookie.com/embed/ABC123XYZ?enablejsapi=1
```

### Markdown Embed (for README/documentation):

```markdown
[![Tutorial Video](https://img.youtube.com/vi/VIDEO_ID/maxresdefault.jpg)](https://www.youtube.com/watch?v=VIDEO_ID)
```

Or for better control, use HTML iframe as shown above.

### Common Causes of Error 153:

- Missing `enablejsapi` parameter
- Incorrect domain (use `youtube-nocookie.com`)
- Video embed restrictions set by video owner
- Invalid video ID
- CORS policy issues
- Missing iframe `allow` attributes

### Testing:

After implementing the fix:
1. Clear browser cache
2. Test in incognito/private mode
3. Verify the video loads and plays correctly
4. Check browser console for any remaining errors
