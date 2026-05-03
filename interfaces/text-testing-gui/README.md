# Text Generation Testing GUI

Interactive web interface for testing the Cloudflare Multi-Agent text generation service.

## Overview

The Text Testing GUI provides a user-friendly interface for testing text generation with multiple AI models. It's built with vanilla JavaScript and Tailwind CSS, deployed on Cloudflare Pages.

## Features

- **Multi-Model Support**: Test OpenAI (GPT-4o, GPT-4 Turbo, GPT-4o-mini) and Anthropic (Claude 3.5 Sonnet, Claude 3.5 Haiku)
- **Advanced Options**: Control max tokens, temperature, and other generation parameters
- **Real-Time Feedback**: Loading states and progress indicators
- **Copy to Clipboard**: Easy copying of generated text
- **Metadata Display**: See tokens used, generation time, provider, and model
- **Settings Persistence**: API keys and instance IDs saved in localStorage
- **Clean UI**: Modern, responsive design with Tailwind CSS

## Deployment

### Prerequisites

- Cloudflare account with Pages enabled
- Wrangler CLI installed

### Deploy

```bash
cd interfaces/text-testing-gui

# Create Pages project (first time only)
npx wrangler pages project create text-testing-gui --production-branch=master

# Deploy
npx wrangler pages deploy public --project-name=text-testing-gui --branch=master
```

### Custom Domain

Add custom domain in Cloudflare Dashboard:
1. Go to Workers & Pages → text-testing-gui → Custom domains
2. Add: `text-testing.example.com`
3. Wait for SSL certificate provisioning (1-5 minutes)

## Usage

1. **Open the GUI**: Navigate to `https://text-testing.example.com`

2. **Configure**:
   - Enter your API Key
   - Select Instance ID (production, development, staging)
   - Choose a model from the dropdown

3. **Generate Text**:
   - Enter your prompt in the text area
   - Optionally adjust advanced settings (max tokens, temperature)
   - Click "Generate Text"

4. **View Results**:
   - See generated text in the results panel
   - View metadata (tokens used, generation time, etc.)
   - Copy text to clipboard with one click

## File Structure

```
text-testing-gui/
├── public/
│   ├── index.html      # Main HTML structure
│   ├── app.js          # Application logic
│   └── styles.css      # Custom styles
└── README.md           # This file
```

## Configuration

### API URL

The GUI connects to the text-gen worker at:
```javascript
const API_URL = 'https://text.example.com';
```

To change the API endpoint, edit `public/app.js`:
```javascript
// Line 3
const API_URL = 'https://your-custom-domain.com';
```

### Supported Models

Models are defined in `index.html`:

**OpenAI:**
- `gpt-4o-mini` - Fast and cost-effective (default)
- `gpt-4o` - Most capable
- `gpt-4-turbo` - Previous generation flagship

**Anthropic:**
- `claude-3-5-sonnet-20241022` - Most capable Claude
- `claude-3-5-haiku-20241022` - Fast and cost-effective

## Advanced Options

Click "Advanced Options" to access:
- **Max Tokens**: Control response length (1-4000)
- **Temperature**: Adjust creativity (0.0-2.0)
  - Lower = more focused and deterministic
  - Higher = more creative and varied

## API Request Format

The GUI sends requests in this format:

```json
{
  "prompt": "Your prompt here",
  "model": "gpt-4o-mini",
  "instance_id": "production",
  "options": {
    "max_tokens": 1000,
    "temperature": 0.7
  }
}
```

## Error Handling

The GUI handles various error scenarios:
- Missing required fields
- Invalid API keys
- Rate limit exceeded
- Network errors
- Provider errors

Errors are displayed with clear messages and automatically dismiss after 5 seconds.

## Local Development

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Logos-Flux/cloudflare-multiagent.git
   cd cloudflare-multiagent/interfaces/text-testing-gui
   ```

2. **Serve locally**:
   ```bash
   # Using Python
   python -m http.server 8000 --directory public

   # Or using Node.js
   npx serve public
   ```

3. **Open in browser**: `http://localhost:8000`

## Customization

### Styling

The GUI uses Tailwind CSS loaded from CDN. Custom styles are in `styles.css`:
- Scrollbar styling for text display
- Loading animation
- Focus states
- Hover effects

### Adding New Models

To add a new model to the dropdown:

1. Edit `public/index.html`
2. Add new `<option>` in the model select:
   ```html
   <option value="new-model-id">New Model Name (Provider)</option>
   ```

### Changing Colors

The GUI uses Tailwind's default color palette. To customize:
1. Replace the Tailwind CDN with a custom build
2. Or add custom CSS in `styles.css`

## Security

- API keys are stored in localStorage (never sent to server except in API calls)
- HTTPS enforced for all API calls
- CORS enabled on the text-gen worker
- No sensitive data logged

**Important**: This is a testing tool. For production applications, implement proper authentication and avoid storing API keys in localStorage.

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Performance

- Minimal bundle size (no build step required)
- Tailwind CSS loaded from CDN (cached)
- Lazy loading for generated content
- Efficient DOM updates

## Troubleshooting

### "Failed to generate text"
- Check API key is correct
- Verify instance ID exists
- Check worker is deployed and healthy
- Check browser console for detailed errors

### "Missing API key for provider"
- Set API keys in worker secrets: `npx wrangler secret put OPENAI_API_KEY`
- Or configure in admin panel

### Slow generation
- Try a faster model (gpt-4o-mini, claude-3-5-haiku)
- Reduce max_tokens
- Check your internet connection

## Related Services

- **Text-Gen Worker**: Backend API for text generation
- **Admin Panel**: Manage instances and API keys
- **Config Service**: Central configuration management

## Support

For issues or questions:
- GitHub: https://github.com/Logos-Flux/cloudflare-multiagent
- Documentation: `/docs`

---

**Built with Claude Code** | **Deployed on Cloudflare Pages**
