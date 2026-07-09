/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Brand palette — mirrors the CSS custom properties in src/index.css :root
        // Neutral scale overridden to the enterprise/SaaS gray ramp — every `slate-*`
        // utility used throughout the app (borders, table rows, sidebar hovers, etc.)
        // now resolves to these exact design-token values.
        slate: {
          50: '#F9FAFB', // Table Header
          100: '#F3F4F6', // Table Hover
          200: '#E5E7EB', // Borders
          300: '#D1D5DB', // Input Border
          400: '#9CA3AF', // Muted Text
          500: '#6B7280',
          600: '#4B5563', // Body Text
          700: '#374151',
          800: '#1F2937', // Sidebar Hover
          900: '#111827', // Headings / Sidebar Background
          950: '#030712',
        },
        primary: {
          50: '#F0FDF4',
          100: '#DCFCE7',
          200: '#BBF7D0',
          300: '#86EFAC',
          400: '#4ADE80',
          500: '#22C55E',
          600: '#16A34A', // Primary Button / Active Menu
          700: '#15803D', // Primary Hover
          800: '#166534',
          900: '#14532D',
          950: '#052E16',
        },
        secondary: {
          50: '#EDF9F0', // Secondary Light
          100: '#D3F0DB',
          200: '#A7E0B8',
          300: '#79CD93',
          400: '#41B468',
          500: '#198D34', // Secondary
          600: '#157A2C',
          700: '#116423',
          800: '#0D4F1C',
          900: '#0A3E16',
        },
        accent: {
          50: '#F0FDF4',
          100: '#DCFCE7', // Accent
          200: '#BBF7D0',
          300: '#86EFAC',
          500: '#22C55E',
          600: '#16A34A',
          700: '#15803D',
        },
        success: {
          50: '#F0FDF4',
          100: '#DCFCE7',
          500: '#22C55E', // Success
          600: '#16A34A',
          700: '#15803D',
        },
        warning: {
          50: '#FFFBEB',
          100: '#FEF3C7',
          500: '#F59E0B', // Warning
          600: '#D97706',
          700: '#B45309',
        },
        danger: {
          50: '#FEF2F2',
          100: '#FEE2E2',
          500: '#EF4444', // Danger
          600: '#DC2626',
          700: '#B91C1C',
        },
        info: {
          50: '#EFF6FF',
          100: '#DBEAFE',
          500: '#3B82F6', // Info
          600: '#2563EB',
          700: '#1D4ED8',
        },
        surface: {
          DEFAULT: '#F5F7FA', // Main Background
          dim: '#E5E7EB', // Borders
          bright: '#FFFFFF', // Cards / Navbar
          container: '#FFFFFF',
          'container-low': '#F9FAFB', // Table Header
          'container-high': '#F0FDF4',
        },
        ink: {
          DEFAULT: '#111827', // Headings
          variant: '#4B5563', // Body Text
          muted: '#9CA3AF', // Muted Text
          outline: '#D1D5DB', // Input Border
        },
        sidebar: '#111827', // Sidebar Background
        'sidebar-hover': '#1F2937', // Sidebar Hover
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', '"Hanken Grotesk"', 'Inter', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      borderRadius: {
        sm: '0.25rem',
        DEFAULT: '0.25rem',
        md: '0.375rem',
        lg: '0.5rem',
        xl: '0.75rem',
        '2xl': '1rem',
      },
      boxShadow: {
        card: '0 1px 2px 0 rgba(15, 23, 42, 0.04), 0 1px 4px 0 rgba(15, 23, 42, 0.04)',
        elevated: '0 4px 12px -2px rgba(15, 23, 42, 0.08), 0 2px 4px -2px rgba(15, 23, 42, 0.06)',
        popover: '0 12px 24px -4px rgba(15, 23, 42, 0.12), 0 4px 8px -2px rgba(15, 23, 42, 0.06)',
      },
      spacing: {
        sidebar: '260px',
        'sidebar-collapsed': '76px',
        topbar: '64px',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-468px 0' },
          '100%': { backgroundPosition: '468px 0' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.3s ease-out',
        shimmer: 'shimmer 1.6s linear infinite',
      },
    },
  },
  plugins: [],
}
