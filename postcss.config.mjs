import tailwindcss from 'tailwindcss'
import autoprefixer from 'autoprefixer'

export default {
  plugins: [
    tailwindcss({ config: '/mnt/agents/output/app/tailwind.config.js' }),
    autoprefixer(),
  ],
}
