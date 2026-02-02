import { defineConfig } from 'tailwindcss'

export default defineConfig({
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
 theme: {
  	extend: { 
  		colors: {
  			'gray-950': 'rgba(19, 23, 52, 1)',
  			'gray-900': 'rgba(35, 39, 68, 1)',
  			'gray-800': 'rgba(51, 55, 84, 1)',
  			'gray-700': 'rgba(66, 70, 100, 1)',
  			'gray-600': 'rgba(82, 86, 116, 1)',
  			'gray-500': 'rgba(106, 109, 139, 1)',
  			'gray-400': 'rgba(122, 125, 155, 1)',
  			'gray-300': 'rgba(142, 145, 167, 1)',
  			'gray-200': 'rgba(159, 162, 184, 1)',
  			'gray-100': 'rgba(176, 179, 201, 1)',
  			'gray-50': 'rgba(197, 199, 217, 1)',
  			'gray-25': 'rgba(236, 237, 245, 1)',
  			'gray-0': 'rgba(255, 255, 255, 1)',
  			'blue-900': 'rgba(9, 14, 53, 1)',
  			'blue-800': 'rgba(14, 22, 87, 1)',
  			'blue-700': 'rgba(20, 31, 121, 1)',
  			'blue-600': 'rgba(26, 40, 154, 1)',
  			'blue-500': 'rgba(31, 48, 188, 1)',
  			'blue-400': 'rgba(56, 74, 222, 1)',
  			'blue-300': 'rgba(90, 105, 228, 1)',
  			'blue-200': 'rgba(123, 135, 233, 1)',
  			'blue-100': 'rgba(157, 166, 239, 1)',
  			'blue-50': 'rgba(191, 196, 244, 1)',
  			'blue-25': 'rgba(241, 242, 253, 1)',
  			'cyan-900': 'rgba(0, 51, 62, 1)',
  			'cyan-800': 'rgba(0, 84, 101, 1)',
  			'cyan-700': 'rgba(0, 116, 141, 1)',
  			'cyan-600': 'rgba(0, 148, 180, 1)',
  			'cyan-500': 'rgba(0, 180, 219, 1)',
  			'cyan-400': 'rgba(23, 214, 255, 1)',
  			'cyan-300': 'rgba(62, 221, 255, 1)',
  			'cyan-200': 'rgba(101, 228, 255, 1)',
  			'cyan-100': 'rgba(141, 235, 255, 1)',
  			'cyan-50': 'rgba(180, 242, 255, 1)',
  			'cyan-25': 'rgba(239, 252, 255, 1)',
  			'red-950': 'rgba(104, 18, 25, 1)',
  			'red-900': 'rgba(139, 24, 34, 1)',
  			'red-800': 'rgba(173, 31, 43, 1)',
  			'red-700': 'rgba(208, 37, 51, 1)',
  			'red-600': 'rgba(233, 53, 68, 1)',
  			'red-500': 'rgba(251, 55, 72, 1)',
  			'red-400': 'rgba(255, 104, 117, 1)',
  			'red-300': 'rgba(255, 151, 160, 1)',
  			'red-200': 'rgba(255, 192, 197, 1)',
  			'red-100': 'rgba(255, 213, 216, 1)',
  			'red-50': 'rgba(255, 235, 236, 1)',
  			'green-950': 'rgba(11, 70, 39, 1)',
  			'green-900': 'rgba(59, 87, 14, 1)',
  			'green-800': 'rgba(81, 121, 20, 1)',
  			'green-700': 'rgba(104, 154, 26, 1)',
  			'green-600': 'rgba(127, 188, 31, 1)',
  			'green-500': 'rgba(157, 222, 56, 1)',
  			'green-400': 'rgba(174, 228, 90, 1)',
  			'green-300': 'rgba(190, 233, 123, 1)',
  			'green-200': 'rgba(207, 239, 157, 1)',
  			'green-100': 'rgba(223, 244, 191, 1)',
  			'green-50': 'rgba(248, 253, 241, 1)',
  			'yellow-950': 'rgba(62, 42, 0, 1)',
  			'yellow-900': 'rgba(101, 69, 0, 1)',
  			'yellow-800': 'rgba(141, 95, 0, 1)',
  			'yellow-700': 'rgba(180, 122, 0, 1)',
  			'yellow-600': 'rgba(219, 148, 0, 1)',
  			'yellow-500': 'rgba(255, 180, 23, 1)',
  			'yellow-400': 'rgba(255, 193, 62, 1)',
  			'yellow-300': 'rgba(255, 205, 101, 1)',
  			'yellow-200': 'rgba(255, 218, 141, 1)',
  			'yellow-100': 'rgba(255, 231, 180, 1)',
  			'yellow-50': 'rgba(255, 250, 239, 1)',
  			'purple-950': 'rgba(53, 26, 117, 1)',
  			'purple-900': 'rgba(61, 29, 134, 1)',
  			'purple-800': 'rgba(76, 37, 167, 1)',
  			'purple-700': 'rgba(91, 44, 201, 1)',
  			'purple-600': 'rgba(105, 62, 224, 1)',
  			'purple-500': 'rgba(125, 82, 244, 1)',
  			'purple-400': 'rgba(140, 113, 246, 1)',
  			'purple-300': 'rgba(168, 151, 255, 1)',
  			'purple-200': 'rgba(202, 192, 255, 1)',
  			'purple-100': 'rgba(220, 213, 255, 1)',
  			'purple-50': 'rgba(239, 235, 255, 1)',
  			'sky-950': 'rgba(18, 75, 104, 1)',
  			'sky-900': 'rgba(24, 101, 139, 1)',
  			'sky-800': 'rgba(31, 126, 173, 1)',
  			'sky-700': 'rgba(37, 151, 208, 1)',
  			'sky-600': 'rgba(53, 173, 233, 1)',
  			'sky-500': 'rgba(71, 194, 255, 1)',
  			'sky-400': 'rgba(104, 205, 255, 1)',
  			'sky-300': 'rgba(151, 220, 255, 1)',
  			'sky-200': 'rgba(192, 234, 255, 1)',
  			'sky-100': 'rgba(213, 241, 255, 1)',
  			'sky-50': 'rgba(235, 248, 255, 1)',
  			'pink-950': 'rgba(104, 18, 61, 1)',
  			'pink-900': 'rgba(139, 24, 82, 1)',
  			'pink-800': 'rgba(173, 31, 102, 1)',
  			'pink-700': 'rgba(208, 37, 122, 1)',
  			'pink-600': 'rgba(233, 53, 143, 1)',
  			'pink-500': 'rgba(251, 75, 163, 1)',
  			'pink-400': 'rgba(255, 104, 179, 1)',
  			'pink-300': 'rgba(255, 151, 203, 1)',
  			'pink-200': 'rgba(255, 192, 223, 1)',
  			'pink-100': 'rgba(255, 213, 234, 1)',
  			'pink-50': 'rgba(255, 235, 244, 1)',
  			'teal-950': 'rgba(11, 70, 62, 1)',
  			'teal-900': 'rgba(22, 100, 90, 1)',
  			'teal-800': 'rgba(26, 117, 105, 1)',
  			'teal-700': 'rgba(23, 140, 125, 1)',
  			'teal-600': 'rgba(29, 175, 156, 1)',
  			'teal-500': 'rgba(34, 211, 187, 1)',
  			'teal-400': 'rgba(63, 222, 201, 1)',
  			'teal-300': 'rgba(132, 235, 221, 1)',
  			'teal-200': 'rgba(194, 245, 238, 1)',
  			'teal-100': 'rgba(208, 251, 245, 1)',
  			'teal-50': 'rgba(228, 251, 248, 1)',
  			'alpha-gray-alpha-24': 'rgba(106, 109, 139, 0.25)',
  			'alpha-gray-alpha-16': 'rgba(106, 109, 139, 0.15)',
  			'alpha-gray-alpha-10': 'rgba(106, 109, 139, 0.1)',
  			'alpha-gray-alpha-5': 'rgba(106, 109, 139, 0.05)',
  			'alpha-blue-alpha-25': 'rgba(56, 74, 222, 0.25)',
  			'alpha-blue-alpha-15': 'rgba(56, 74, 222, 0.15)',
  			'alpha-blue-alpha-10': 'rgba(56, 74, 222, 0.1)',
  			'alpha-blue-alpha-5': 'rgba(56, 74, 222, 0.05)',
  			'alpha-brown-alpha-24': 'rgba(171, 129, 103, 0.24)',
  			'alpha-brown-alpha-16': 'rgba(171, 129, 103, 0.16)',
  			'alpha-brown-alpha-10': 'rgba(171, 129, 103, 0.1)',
  			'alpha-red-alpha-24': 'rgba(251, 55, 72, 0.24)',
  			'alpha-red-alpha-16': 'rgba(251, 55, 72, 0.16)',
  			'alpha-red-alpha-10': 'rgba(251, 55, 72, 0.1)',
  			'alpha-green-alpha-24': 'rgba(31, 193, 107, 0.24)',
  			'alpha-green-alpha-16': 'rgba(31, 193, 107, 0.16)',
  			'alpha-green-alpha-10': 'rgba(31, 193, 107, 0.1)',
  			'alpha-yellow-alpha-24': 'rgba(251, 198, 75, 0.24)',
  			'alpha-yellow-alpha-16': 'rgba(251, 198, 75, 0.16)',
  			'alpha-yellow-alpha-10': 'rgba(251, 198, 75, 0.1)',
  			'alpha-purple-alpha-24': 'rgba(120, 77, 239, 0.24)',
  			'alpha-purple-alpha-16': 'rgba(120, 77, 239, 0.16)',
  			'alpha-purple-alpha-10': 'rgba(120, 77, 239, 0.1)',
  			'alpha-sky-alpha-24': 'rgba(71, 194, 255, 0.24)',
  			'alpha-sky-alpha-16': 'rgba(71, 194, 255, 0.16)',
  			'alpha-pink-alpha-24': 'rgba(251, 75, 163, 0.24)',
  			'alpha-sky-alpha-10': 'rgba(71, 194, 255, 0.1)',
  			'alpha-pink-alpha-16': 'rgba(251, 75, 163, 0.16)',
  			'alpha-pink-alpha-10': 'rgba(251, 75, 163, 0.1)',
  			'alpha-teal-alpha-24': 'rgba(34, 211, 187, 0.24)',
  			'alpha-teal-alpha-16': 'rgba(34, 211, 187, 0.16)',
  			'alpha-teal-alpha-10': 'rgba(34, 211, 187, 0.1)',
  			'alpha-white-alpha-24': 'rgba(255, 255, 255, 0.24)',
  			'alpha-white-alpha-16': 'rgba(255, 255, 255, 0.16)',
  			'alpha-white-alpha-10': 'rgba(255, 255, 255, 0.1)',
  			'alpha-black-alpha-24': 'rgba(14, 18, 27, 0.24)',
  			'alpha-black-alpha-16': 'rgba(14, 18, 27, 0.16)',
  			'alpha-black-alpha-10': 'rgba(14, 18, 27, 0.1)',
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
  			'static-static-black': {
  				light: 'rgba(35, 39, 68, 1)',
  				dark: 'rgba(19, 23, 52, 1)',
  				DEFAULT: 'rgba(35, 39, 68, 1)'
  			},
  			'static-static-white': {
  				light: 'rgba(255, 255, 255, 1)',
  				dark: 'rgba(255, 255, 255, 1)',
  				DEFAULT: 'rgba(255, 255, 255, 1)'
  			},
  			'bg-strong-950': {
  				light: 'rgba(35, 39, 68, 1)',
  				dark: 'rgba(255, 255, 255, 1)',
  				DEFAULT: 'rgba(35, 39, 68, 1)'
  			},
  			'bg-surface-800': {
  				light: 'rgba(51, 55, 84, 1)',
  				dark: 'rgba(159, 162, 184, 1)',
  				DEFAULT: 'rgba(51, 55, 84, 1)'
  			},
  			'bg-sub-300': {
  				light: 'rgba(142, 145, 167, 1)',
  				dark: 'rgba(82, 86, 116, 1)',
  				DEFAULT: 'rgba(142, 145, 167, 1)'
  			},
  			'bg-soft-200': {
  				light: 'rgba(159, 162, 184, 1)',
  				dark: 'rgba(66, 70, 100, 1)',
  				DEFAULT: 'rgba(159, 162, 184, 1)'
  			},
  			'bg-weak-50': {
  				light: 'rgba(197, 199, 217, 1)',
  				dark: 'rgba(35, 39, 68, 1)',
  				DEFAULT: 'rgba(197, 199, 217, 1)'
  			},
  			'bg-weak-25': {
  				light: 'rgba(236, 237, 245, 1)',
  				dark: 'rgba(35, 39, 68, 1)',
  				DEFAULT: 'rgba(236, 237, 245, 1)'
  			},
  			'bg-white-0': {
  				light: 'rgba(255, 255, 255, 1)',
  				dark: 'rgba(19, 23, 52, 1)',
  				DEFAULT: 'rgba(255, 255, 255, 1)'
  			},
  			'text-strong-950': {
  				light: 'rgba(35, 39, 68, 1)',
  				dark: 'rgba(255, 255, 255, 1)',
  				DEFAULT: 'rgba(35, 39, 68, 1)'
  			},
  			'text-sub-600': {
  				light: 'rgba(82, 86, 116, 1)',
  				dark: 'rgba(122, 125, 155, 1)',
  				DEFAULT: 'rgba(82, 86, 116, 1)'
  			},
  			'text-soft-400': {
  				light: 'rgba(122, 125, 155, 1)',
  				dark: 'rgba(106, 109, 139, 1)',
  				DEFAULT: 'rgba(122, 125, 155, 1)'
  			},
  			'text-disabled-300': {
  				light: 'rgba(142, 145, 167, 1)',
  				dark: 'rgba(82, 86, 116, 1)',
  				DEFAULT: 'rgba(142, 145, 167, 1)'
  			},
  			'text-white-0': {
  				light: 'rgba(255, 255, 255, 1)',
  				dark: 'rgba(19, 23, 52, 1)',
  				DEFAULT: 'rgba(255, 255, 255, 1)'
  			},
  			'stroke-strong-950': {
  				light: 'rgba(35, 39, 68, 1)',
  				dark: 'rgba(255, 255, 255, 1)',
  				DEFAULT: 'rgba(35, 39, 68, 1)'
  			},
  			'stroke-sub-300': {
  				light: 'rgba(142, 145, 167, 1)',
  				dark: 'rgba(82, 86, 116, 1)',
  				DEFAULT: 'rgba(142, 145, 167, 1)'
  			},
  			'stroke-soft-200': {
  				light: 'rgba(159, 162, 184, 1)',
  				dark: 'rgba(66, 70, 100, 1)',
  				DEFAULT: 'rgba(159, 162, 184, 1)'
  			},
  			'stroke-white-0': {
  				light: 'rgba(255, 255, 255, 1)',
  				dark: 'rgba(19, 23, 52, 1)',
  				DEFAULT: 'rgba(255, 255, 255, 1)'
  			},
  			'icon-strong-950': {
  				light: 'rgba(35, 39, 68, 1)',
  				dark: 'rgba(255, 255, 255, 1)',
  				DEFAULT: 'rgba(35, 39, 68, 1)'
  			},
  			'icon-sub-600': {
  				light: 'rgba(82, 86, 116, 1)',
  				dark: 'rgba(122, 125, 155, 1)',
  				DEFAULT: 'rgba(82, 86, 116, 1)'
  			},
  			'icon-soft-400': {
  				light: 'rgba(122, 125, 155, 1)',
  				dark: 'rgba(106, 109, 139, 1)',
  				DEFAULT: 'rgba(122, 125, 155, 1)'
  			},
  			'icon-disabled-300': {
  				light: 'rgba(142, 145, 167, 1)',
  				dark: 'rgba(82, 86, 116, 1)',
  				DEFAULT: 'rgba(142, 145, 167, 1)'
  			},
  			'state-faded-dark': {
  				light: 'rgba(51, 55, 84, 1)',
  				dark: 'rgba(142, 145, 167, 1)',
  				DEFAULT: 'rgba(51, 55, 84, 1)'
  			},
  			'state-faded-base': {
  				light: 'rgba(106, 109, 139, 1)',
  				dark: 'rgba(106, 109, 139, 1)',
  				DEFAULT: 'rgba(106, 109, 139, 1)'
  			},
  			'state-faded-light': {
  				light: 'rgba(159, 162, 184, 1)',
  				dark: 'rgba(106, 109, 139, 0.25)',
  				DEFAULT: 'rgba(159, 162, 184, 1)'
  			},
  			'state-faded-lighter': {
  				light: 'rgba(197, 199, 217, 1)',
  				dark: 'rgba(106, 109, 139, 0.15)',
  				DEFAULT: 'rgba(197, 199, 217, 1)'
  			},
  			'state-information-dark': {
  				light: 'rgba(9, 14, 53, 1)',
  				dark: 'rgba(90, 105, 228, 1)',
  				DEFAULT: 'rgba(9, 14, 53, 1)'
  			},
  			'state-information-base': {
  				light: 'rgba(56, 74, 222, 1)',
  				dark: 'rgba(56, 74, 222, 1)',
  				DEFAULT: 'rgba(56, 74, 222, 1)'
  			},
  			'state-information-light': {
  				light: 'rgba(157, 166, 239, 1)',
  				dark: 'rgba(56, 74, 222, 0.25)',
  				DEFAULT: 'rgba(157, 166, 239, 1)'
  			},
  			'state-information-lighter': {
  				light: 'rgba(241, 242, 253, 1)',
  				dark: 'rgba(56, 74, 222, 0.15)',
  				DEFAULT: 'rgba(241, 242, 253, 1)'
  			},
  			'state-warning-dark': {
  				light: 'rgba(0, 51, 62, 1)',
  				dark: 'rgba(62, 221, 255, 1)',
  				DEFAULT: 'rgba(0, 51, 62, 1)'
  			},
  			'state-warning-base': {
  				light: 'rgba(23, 214, 255, 1)',
  				dark: 'rgba(0, 180, 219, 1)',
  				DEFAULT: 'rgba(23, 214, 255, 1)'
  			},
  			'state-warning-light': {
  				light: 'rgba(141, 235, 255, 1)',
  				dark: 'rgba(171, 129, 103, 0.24)',
  				DEFAULT: 'rgba(141, 235, 255, 1)'
  			},
  			'state-warning-lighter': {
  				light: 'rgba(239, 252, 255, 1)',
  				dark: 'rgba(171, 129, 103, 0.16)',
  				DEFAULT: 'rgba(239, 252, 255, 1)'
  			},
  			'state-error-dark': {
  				light: 'rgba(104, 18, 25, 1)',
  				dark: 'rgba(255, 104, 117, 1)',
  				DEFAULT: 'rgba(104, 18, 25, 1)'
  			},
  			'state-error-base': {
  				light: 'rgba(251, 55, 72, 1)',
  				dark: 'rgba(233, 53, 68, 1)',
  				DEFAULT: 'rgba(251, 55, 72, 1)'
  			},
  			'state-error-light': {
  				light: 'rgba(255, 192, 197, 1)',
  				dark: 'rgba(251, 55, 72, 0.24)',
  				DEFAULT: 'rgba(255, 192, 197, 1)'
  			},
  			'state-error-lighter': {
  				light: 'rgba(255, 235, 236, 1)',
  				dark: 'rgba(251, 55, 72, 0.16)',
  				DEFAULT: 'rgba(255, 235, 236, 1)'
  			},
  			'state-success-dark': {
  				light: 'rgba(11, 70, 39, 1)',
  				dark: 'rgba(174, 228, 90, 1)',
  				DEFAULT: 'rgba(11, 70, 39, 1)'
  			},
  			'state-success-base': {
  				light: 'rgba(157, 222, 56, 1)',
  				dark: 'rgba(127, 188, 31, 1)',
  				DEFAULT: 'rgba(157, 222, 56, 1)'
  			},
  			'state-success-light': {
  				light: 'rgba(207, 239, 157, 1)',
  				dark: 'rgba(31, 193, 107, 0.16)',
  				DEFAULT: 'rgba(207, 239, 157, 1)'
  			},
  			'state-success-lighter': {
  				light: 'rgba(248, 253, 241, 1)',
  				dark: 'rgba(31, 193, 107, 0.1)',
  				DEFAULT: 'rgba(248, 253, 241, 1)'
  			},
  			'state-away-dark': {
  				light: 'rgba(62, 42, 0, 1)',
  				dark: 'rgba(255, 193, 62, 1)',
  				DEFAULT: 'rgba(62, 42, 0, 1)'
  			},
  			'state-away-base': {
  				light: 'rgba(255, 180, 23, 1)',
  				dark: 'rgba(219, 148, 0, 1)',
  				DEFAULT: 'rgba(255, 180, 23, 1)'
  			},
  			'state-away-light': {
  				light: 'rgba(255, 218, 141, 1)',
  				dark: 'rgba(251, 198, 75, 0.24)',
  				DEFAULT: 'rgba(255, 218, 141, 1)'
  			},
  			'state-away-lighter': {
  				light: 'rgba(255, 250, 239, 1)',
  				dark: 'rgba(251, 198, 75, 0.16)',
  				DEFAULT: 'rgba(255, 250, 239, 1)'
  			},
  			'state-feature-dark': {
  				light: 'rgba(53, 26, 117, 1)',
  				dark: 'rgba(140, 113, 246, 1)',
  				DEFAULT: 'rgba(53, 26, 117, 1)'
  			},
  			'state-feature-base': {
  				light: 'rgba(125, 82, 244, 1)',
  				dark: 'rgba(125, 82, 244, 1)',
  				DEFAULT: 'rgba(125, 82, 244, 1)'
  			},
  			'state-feature-light': {
  				light: 'rgba(202, 192, 255, 1)',
  				dark: 'rgba(120, 77, 239, 0.24)',
  				DEFAULT: 'rgba(202, 192, 255, 1)'
  			},
  			'state-feature-lighter': {
  				light: 'rgba(239, 235, 255, 1)',
  				dark: 'rgba(120, 77, 239, 0.16)',
  				DEFAULT: 'rgba(239, 235, 255, 1)'
  			},
  			'state-verified-dark': {
  				light: 'rgba(18, 75, 104, 1)',
  				dark: 'rgba(104, 205, 255, 1)',
  				DEFAULT: 'rgba(18, 75, 104, 1)'
  			},
  			'state-verified-base': {
  				light: 'rgba(71, 194, 255, 1)',
  				dark: 'rgba(53, 173, 233, 1)',
  				DEFAULT: 'rgba(71, 194, 255, 1)'
  			},
  			'state-verified-light': {
  				light: 'rgba(192, 234, 255, 1)',
  				dark: 'rgba(71, 194, 255, 0.24)',
  				DEFAULT: 'rgba(192, 234, 255, 1)'
  			},
  			'state-verified-lighter': {
  				light: 'rgba(235, 248, 255, 1)',
  				dark: 'rgba(71, 194, 255, 0.16)',
  				DEFAULT: 'rgba(235, 248, 255, 1)'
  			},
  			'state-highlighted-dark': {
  				light: 'rgba(104, 18, 61, 1)',
  				dark: 'rgba(255, 104, 179, 1)',
  				DEFAULT: 'rgba(104, 18, 61, 1)'
  			},
  			'state-highlighted-base': {
  				light: 'rgba(251, 75, 163, 1)',
  				dark: 'rgba(233, 53, 143, 1)',
  				DEFAULT: 'rgba(251, 75, 163, 1)'
  			},
  			'state-highlighted-light': {
  				light: 'rgba(255, 192, 223, 1)',
  				dark: 'rgba(251, 75, 163, 0.24)',
  				DEFAULT: 'rgba(255, 192, 223, 1)'
  			},
  			'state-highlighted-lighter': {
  				light: 'rgba(255, 235, 244, 1)',
  				dark: 'rgba(251, 75, 163, 0.16)',
  				DEFAULT: 'rgba(255, 235, 244, 1)'
  			},
  			'state-stable-dark': {
  				light: 'rgba(11, 70, 62, 1)',
  				dark: 'rgba(63, 222, 201, 1)',
  				DEFAULT: 'rgba(11, 70, 62, 1)'
  			},
  			'state-stable-base': {
  				light: 'rgba(34, 211, 187, 1)',
  				dark: 'rgba(29, 175, 156, 1)',
  				DEFAULT: 'rgba(34, 211, 187, 1)'
  			},
  			'state-stable-light': {
  				light: 'rgba(194, 245, 238, 1)',
  				dark: 'rgba(34, 211, 187, 0.24)',
  				DEFAULT: 'rgba(194, 245, 238, 1)'
  			},
  			'state-stable-lighter': {
  				light: 'rgba(228, 251, 248, 1)',
  				dark: 'rgba(34, 211, 187, 0.16)',
  				DEFAULT: 'rgba(228, 251, 248, 1)'
  			},
  			'icon-white-0': {
  				light: 'rgba(255, 255, 255, 1)',
  				dark: 'rgba(19, 23, 52, 1)',
  				DEFAULT: 'rgba(255, 255, 255, 1)'
  			},
  			'overlay-overlay': {
  				light: 'rgba(2, 13, 23, 0.24)',
  				dark: 'rgba(82, 88, 102, 0.32)',
  				DEFAULT: 'rgba(2, 13, 23, 0.24)'
  			},
  			'social-apple': {
  				light: 'rgba(0, 0, 0, 1)',
  				dark: 'rgba(255, 255, 255, 1)',
  				DEFAULT: 'rgba(0, 0, 0, 1)'
  			},
  			'social-twitter': {
  				light: 'rgba(1, 1, 1, 1)',
  				dark: 'rgba(255, 255, 255, 1)',
  				DEFAULT: 'rgba(1, 1, 1, 1)'
  			},
  			'social-github': {
  				light: 'rgba(36, 41, 47, 1)',
  				dark: 'rgba(255, 255, 255, 1)',
  				DEFAULT: 'rgba(36, 41, 47, 1)'
  			},
  			'social-notion': {
  				light: 'rgba(30, 34, 38, 1)',
  				dark: 'rgba(255, 255, 255, 1)',
  				DEFAULT: 'rgba(30, 34, 38, 1)'
  			},
  			'social-tidal': {
  				light: 'rgba(0, 0, 0, 1)',
  				dark: 'rgba(255, 255, 255, 1)',
  				DEFAULT: 'rgba(0, 0, 0, 1)'
  			},
  			'social-amazon': {
  				light: 'rgba(53, 62, 71, 1)',
  				dark: 'rgba(255, 255, 255, 1)',
  				DEFAULT: 'rgba(53, 62, 71, 1)'
  			},
  			'social-zendesk': {
  				light: 'rgba(22, 20, 13, 1)',
  				dark: 'rgba(255, 255, 255, 1)',
  				DEFAULT: 'rgba(22, 20, 13, 1)'
  			},
  			'illustration-strong-400': {
  				light: 'rgba(122, 125, 155, 1)',
  				dark: 'rgba(82, 86, 116, 1)',
  				DEFAULT: 'rgba(122, 125, 155, 1)'
  			},
  			'illustration-sub-300': {
  				light: 'rgba(142, 145, 167, 1)',
  				dark: 'rgba(66, 70, 100, 1)',
  				DEFAULT: 'rgba(142, 145, 167, 1)'
  			},
  			'illustration-soft-200': {
  				light: 'rgba(159, 162, 184, 1)',
  				dark: 'rgba(51, 55, 84, 1)',
  				DEFAULT: 'rgba(159, 162, 184, 1)'
  			},
  			'illustration-weak-100': {
  				light: 'rgba(176, 179, 201, 1)',
  				dark: 'rgba(35, 39, 68, 1)',
  				DEFAULT: 'rgba(176, 179, 201, 1)'
  			},
  			'illustration-white-0': {
  				light: 'rgba(255, 255, 255, 1)',
  				dark: 'rgba(19, 23, 52, 1)',
  				DEFAULT: 'rgba(255, 255, 255, 1)'
  			},
  			'primary-dark': {
  				'💙-blue': 'rgba(20, 31, 121, 1)',
  				'💜-purple': 'rgba(76, 37, 167, 1)',
  				'🧡-orange': 'rgba(0, 116, 141, 1)',
  				'🩵-sky': 'rgba(31, 126, 173, 1)',
  				DEFAULT: 'rgba(20, 31, 121, 1)'
  			},
  			'primary-darker': {
  				'💙-blue': 'rgba(26, 40, 154, 1)',
  				'💜-purple': 'rgba(91, 44, 201, 1)',
  				'🧡-orange': 'rgba(0, 148, 180, 1)',
  				'🩵-sky': 'rgba(37, 151, 208, 1)',
  				DEFAULT: 'rgba(26, 40, 154, 1)'
  			},
  			'primary-base': {
  				'💙-blue': 'rgba(31, 48, 188, 1)',
  				'💜-purple': 'rgba(125, 82, 244, 1)',
  				'🧡-orange': 'rgba(23, 214, 255, 1)',
  				'🩵-sky': 'rgba(53, 173, 233, 1)',
  				DEFAULT: 'rgba(31, 48, 188, 1)'
  			},
  			'primary-alpha-24': {
  				'💙-blue': 'rgba(56, 74, 222, 0.25)',
  				'💜-purple': 'rgba(120, 77, 239, 0.24)',
  				'🧡-orange': 'rgba(171, 129, 103, 0.24)',
  				'🩵-sky': 'rgba(71, 194, 255, 0.24)',
  				DEFAULT: 'rgba(56, 74, 222, 0.25)'
  			},
  			'primary-alpha-16': {
  				'💙-blue': 'rgba(56, 74, 222, 0.15)',
  				'💜-purple': 'rgba(120, 77, 239, 0.16)',
  				'🧡-orange': 'rgba(171, 129, 103, 0.16)',
  				'🩵-sky': 'rgba(71, 194, 255, 0.16)',
  				DEFAULT: 'rgba(56, 74, 222, 0.15)'
  			},
  			'primary-alpha-10': {
  				'💙-blue': 'rgba(56, 74, 222, 0.1)',
  				'💜-purple': 'rgba(120, 77, 239, 0.1)',
  				'🧡-orange': 'rgba(171, 129, 103, 0.1)',
  				'🩵-sky': 'rgba(71, 194, 255, 0.1)',
  				DEFAULT: 'rgba(56, 74, 222, 0.1)'
  			},
  			sidebar: {
  				DEFAULT: 'hsl(var(--sidebar-background))',
  				foreground: 'hsl(var(--sidebar-foreground))',
  				primary: 'hsl(var(--sidebar-primary))',
  				'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
  				accent: 'hsl(var(--sidebar-accent))',
  				'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
  				// border: 'hsl(var(--sidebar-border))',
  				ring: 'hsl(var(--sidebar-ring))'
  			}
  		},
		fontFamily: {
			inter: [
				'Inter',
				'sans-serif'
			],
			brico: [
				'Bricolage Grotesque',
				'sans-serif'
			],
			outfit: [
				'Outfit',
				'sans-serif'
			],
			sans: [
				'Outfit',
				'sans-serif'
			]
		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		fontSize: {
  			'clamp-14': 'clamp(12px, 0.75rem + 0.5vw, 16px)',
  			'clamp-16': 'clamp(14px, 0.875rem + 0.75vw, 18px)',
  			'clamp-18': 'clamp(16px, 1rem + 0.75vw, 20px)',
  			'clamp-24': 'clamp(20px, 1.25rem + 1vw, 28px)',
  			'clamp-32': 'clamp(28px, 1.75rem + 1.5vw, 36px)',
  			'clamp-36': 'clamp(32px, 2rem + 2vw, 40px)'
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
}) 
