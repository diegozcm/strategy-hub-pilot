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
				strategy: {
					'red-dark': 'hsl(var(--strategy-red-dark))',
					'red-light': 'hsl(var(--strategy-red-light))',
					'blue-navy': 'hsl(var(--strategy-blue-navy))',
					'blue-navy-light': 'hsl(var(--strategy-blue-navy-light))',
					'blue-bright': 'hsl(var(--strategy-blue-bright))',
					'blue-bright-hover': 'hsl(var(--strategy-blue-bright-hover))',
					'gray-light': 'hsl(var(--strategy-gray-light))',
					'gray-medium': 'hsl(var(--strategy-gray-medium))'
				},
			brand: {
				DEFAULT: 'hsl(var(--brand))',
				foreground: 'hsl(var(--brand-foreground))'
			},
			cofound: {
					'blue-light': 'hsl(var(--cofound-blue-light))',
					'green': 'hsl(var(--cofound-green))',
					'blue-dark': 'hsl(var(--cofound-blue-dark))',
					'white': 'hsl(var(--cofound-white))',
					// Legacy colors
					cyan: 'hsl(var(--cofound-cyan))',
					navy: 'hsl(var(--cofound-navy))',
					lime: 'hsl(var(--cofound-lime))',
					'light-gray': 'hsl(var(--cofound-light-gray))'
				}
			},
		fontFamily: {
			sans: ['Lexend', 'sans-serif'],
			lexend: ['Lexend', 'sans-serif'],
			display: ['Saira', 'sans-serif'],
		},
		boxShadow: {
			soft: '0 10px 30px -18px hsl(207 62% 14% / 0.25)',
			elev: '0 18px 40px -24px hsl(207 62% 14% / 0.45)',
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
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out'
			}
		}
	},
	plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
} satisfies Config;
