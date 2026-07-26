
import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				},
				// Modern blue palette inspired by the design
				'modern-blue': {
					50: 'hsl(var(--modern-blue-50))',
					100: 'hsl(var(--modern-blue-100))',
					200: 'hsl(var(--modern-blue-200))',
					300: 'hsl(var(--modern-blue-300))',
					400: 'hsl(var(--modern-blue-400))',
					500: 'hsl(var(--modern-blue-500))',
					600: 'hsl(var(--modern-blue-600))',
					700: 'hsl(var(--modern-blue-700))',
					800: 'hsl(var(--modern-blue-800))',
					900: 'hsl(var(--modern-blue-900))',
				},
				// Override Tailwind's default blue palette to align every hardcoded
				// `bg-blue-*`, `text-blue-*`, `border-blue-*` with the ARCANA navy + electric palette.
				blue: {
					50: 'hsl(214 100% 97%)',
					100: 'hsl(214 95% 93%)',
					200: 'hsl(214 92% 85%)',
					300: 'hsl(214 95% 72%)',
					400: 'hsl(214 100% 62%)',
					500: 'hsl(214 100% 56%)',
					600: 'hsl(218 85% 40%)',
					700: 'hsl(220 80% 30%)',
					800: 'hsl(220 78% 22%)',
					900: 'hsl(222 75% 15%)',
					950: 'hsl(222 70% 10%)',
				},
				// Indigo/sky often used alongside blue — keep them in the same family.
				indigo: {
					50: 'hsl(220 100% 97%)',
					100: 'hsl(220 95% 93%)',
					200: 'hsl(220 92% 85%)',
					300: 'hsl(220 90% 72%)',
					400: 'hsl(220 90% 60%)',
					500: 'hsl(220 85% 50%)',
					600: 'hsl(220 80% 40%)',
					700: 'hsl(222 78% 30%)',
					800: 'hsl(222 75% 22%)',
					900: 'hsl(224 72% 15%)',
					950: 'hsl(224 68% 10%)',
				},
				sky: {
					50: 'hsl(210 100% 97%)',
					100: 'hsl(210 95% 92%)',
					200: 'hsl(210 92% 84%)',
					300: 'hsl(210 95% 72%)',
					400: 'hsl(212 100% 62%)',
					500: 'hsl(214 100% 56%)',
					600: 'hsl(216 90% 45%)',
					700: 'hsl(218 85% 35%)',
					800: 'hsl(220 80% 25%)',
					900: 'hsl(222 75% 17%)',
					950: 'hsl(222 70% 11%)',
				},

			},
			backgroundImage: {
				'modern-gradient': 'linear-gradient(135deg, hsl(var(--modern-blue-500)) 0%, hsl(var(--modern-blue-600)) 50%, hsl(var(--modern-blue-700)) 100%)',
				'modern-gradient-soft': 'linear-gradient(135deg, hsl(var(--modern-blue-100)) 0%, hsl(var(--modern-blue-200)) 100%)',
				'modern-blue-gradient': 'linear-gradient(135deg, hsl(var(--modern-blue-500)) 0%, hsl(var(--modern-blue-600)) 100%)',
				'modern-glass': 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				},
				'fade-in': {
					'0%': {
						opacity: '0',
						transform: 'translateY(10px)'
					},
					'100%': {
						opacity: '1',
						transform: 'translateY(0)'
					}
				},
				'scale-in': {
					'0%': {
						transform: 'scale(0.95)',
						opacity: '0'
					},
					'100%': {
						transform: 'scale(1)',
						opacity: '1'
					}
				},
				'slide-up': {
					'0%': {
						transform: 'translateY(20px)',
						opacity: '0'
					},
					'100%': {
						transform: 'translateY(0)',
						opacity: '1'
					}
				},
				'float': {
					'0%, 100%': { transform: 'translateY(0px)' },
					'50%': { transform: 'translateY(-10px)' }
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'fade-in': 'fade-in 0.5s ease-out',
				'scale-in': 'scale-in 0.3s ease-out',
				'slide-up': 'slide-up 0.6s ease-out',
				'float': 'float 3s ease-in-out infinite'
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
