// All design tokens from Figma JSON (Brand/Primitives, Alias, Light, Dark)
export const tokens = {
	Brand: { 
		Grey: {
			0: '#ffffff', 25: '#ecedf5', 50: '#c5c7d9', 100: '#b0b3c9', 200: '#9fa2b8', 300: '#8e91a7', 400: '#7a7d9b', 500: '#6a6d8b', 600: '#525674', 700: '#424664', 800: '#333754', 900: '#232744', 950: '#131734',
		},
		Orange: {
			50: '#fffaef', 100: '#ffe7b4', 200: '#ffcd65', 300: '#ffcd65', 400: '#ffc13e', 500: '#ffb417', 600: '#db9400', 700: '#b47a00', 800: '#8d5f00', 900: '#654500', 950: '#3e2a00',
		},
		Blue: {
			50: '#f1f2fd', 100: '#bfc4f4', 200: '#9da6ef', 300: '#7b87e9', 400: '#5a69e4', 500: '#384ade', 600: '#1f30bc', 700: '#1a289a', 800: '#141f79', 900: '#0e1657', 950: '#090e35',
		}, 
		Red: {
			50: '#ffebec', 100: '#ffd5d8', 200: '#ff97a0', 300: '#ff97a0', 400: '#ff6875', 500: '#fb3748', 600: '#e93544', 700: '#d02533', 800: '#ad1f2b', 900: '#8b1822', 950: '#681219',
		},
		Purple: {
			50: '#efebff', 100: '#dcd5ff', 200: '#cac0ff', 300: '#a897ff', 400: '#8c71f6', 500: '#7d52f4', 600: '#693ee0', 700: '#5b2cc9', 800: '#4c25a7', 900: '#3d1d86', 950: '#351a75',
		},
		Pink: {
			50: '#ffebf4', 100: '#ffd5ea', 200: '#ffc0df', 300: '#ff97cb', 400: '#ff68b3', 500: '#fb4ba3', 600: '#e9358f', 700: '#d0257a', 800: '#ad1f66', 900: '#8b1852', 950: '#68123d',
		},
		Green: {
			50: '#f8fdf1', 100: '#dff4bf', 200: '#cfef9d', 300: '#bee97b', 400: '#aee45a', 500: '#9dde38', 600: '#7fbc1f', 700: '#689a1a', 800: '#517914', 900: '#3b570e', 950: '#2c4800',
		}, 
		Scale: {
			0: 0, 25: 1, 50: 2, 100: 4, 200: 8, 300: 12, 400: 16, 500: 20, 600: 24, 700: 28, 800: 32, 900: 40, 1000: 48,
		},
		Numbers: {
			0: 0, 2: 2, 4: 4, 6: 6, 8: 8, 10: 10, 12: 12, 14: 14, 16: 16, 20: 20, 24: 24, 32: 32, 40: 40, 48: 48, 56: 56, 64: 64,
		}, 
	}, 
	Alias: {
		Primary: { 50: '{Blue.50}', 100: '{Blue.100}', 200: '{Blue.200}', 300: '{Blue.300}', 400: '{Blue.400}', 500: '{Blue.500}', 600: '{Blue.600}', 700: '{Blue.700}', 800: '{Blue.800}', 900: '{Blue.900}', 950: '{Blue.950}' },
		Information: { 50: '{Blue.50}', 100: '{Blue.100}', 200: '{Blue.200}', 300: '{Blue.300}', 400: '{Blue.400}', 500: '{Blue.500}', 600: '{Blue.600}', 700: '{Blue.700}', 800: '{Blue.800}', 900: '{Blue.900}', 950: '{Blue.950}' },
		Warning: { 50: '{Orange.50}', 100: '{Orange.100}', 200: '{Orange.200}', 300: '{Orange.300}', 400: '{Orange.400}', 500: '{Orange.500}', 600: '{Orange.600}', 700: '{Orange.700}', 800: '{Orange.800}', 900: '{Orange.900}', 950: '{Orange.950}' },
		Error: { 50: '{Red.50}', 100: '{Red.100}', 200: '{Red.200}', 300: '{Red.300}', 400: '{Red.400}', 500: '{Red.500}', 600: '{Red.600}', 700: '{Red.700}', 800: '{Red.800}', 900: '{Red.900}', 950: '{Red.950}' },
		Success: { 50: '{Green.50}', 100: '{Green.100}', 200: '{Green.200}', 300: '{Green.300}', 400: '{Green.400}', 500: '{Green.500}', 600: '{Green.600}', 700: '{Green.700}', 800: '{Green.800}', 900: '{Green.900}', 950: '{Green.950}' },
		Base: { white: '{Grey.0}', Black: '{Grey.950}' },
		Neutral: { 25: '{Grey.25}', 50: '{Grey.50}', 100: '{Grey.100}', 200: '{Grey.200}', 300: '{Grey.300}', 400: '{Grey.400}', 500: '{Grey.500}', 600: '{Grey.600}', 700: '{Grey.700}', 800: '{Grey.800}', 900: '{Grey.900}', 950: '{Grey.950}' },
		'Border Width': { 0: '{Scale.0}', 25: '{Scale.25}', 50: '{Scale.50}', 100: '{Scale.50}', 200: '{Scale.100}' },
	},
	Light: {  
		Surface: {
			Primary: '{Base.white}', Foreground: '{Neutral.25}', Modal: '{Base.white}', Overlay: '{Neutral.400}', 'Modal Handle': '{Neutral.50}'
		}, 
		Button: {
			Primary: '{Primary.600}', 'Primary Active': '{Primary.700}', 'Primary Disabled': '{Neutral.25}', Secondary: '{Primary.50}', Danger: '{Error.500}', 'Primary Text': '{Base.white}', 'Secondary Text': '{Primary.700}', 'Danger Text': '{Base.white}', 'Primary Disabled Text': '{Neutral.300}'
		},
		Typography: {
			Heading: '{Neutral.900}', Subtext: '{Neutral.700}', Body: '{Neutral.700}', Display: '{Neutral.950}', Caption: '{Neutral.600}', 'Decorated-Blue-Text': '{Blue.600}'
		},
		Spot: {
			'Spot-500-Blue': '{Primary.600}', 'Spot-500-Green': '{Green.800}', 'Spot-500-Purple': '{Purple.800}', 'Spot-500-Red': '{Red.500}', 'Spot-500-Pink': '{Pink.700}', 'Spot-500-Yellow': '{Orange.700}', 'Spot-500-Neutral': '{Neutral.800}'
		}, 
		Highlight: {
			'Highlight Blue': { 50: '{Primary.50}', 100: '{Primary.100}', 500: '{Primary.500}' },
			'Highlight Green': { 50: '{Green.50}', 100: '{Green.100}', 500: '{Green.600}', 800: '{Green.900}' },
			'Highlight Purple': { 50: '{Purple.50}', 100: '{Purple.100}', 500: '{Purple.600}' },
			'Highlight Yellow': { 50: '{Orange.50}', 100: '{Orange.100}', 500: '{Orange.600}', 800: '{Orange.800}' },
			'Highlight Red': { 50: '{Red.50}', 100: '{Red.100}', 500: '{Red.500}', 800: '{Red.900}' },
			'HIghhlight Gray': { 50: '{Neutral.25}', 100: '{Neutral.50}', 500: '{Neutral.500}' },
			'Highlight Pink': { 50: '{Pink.50}', 100: '{Pink.100}', 500: '{Pink.600}' },
		},
		Icon: {
			Nav: '{Neutral.800}', 'Nav Inactive': '{Neutral.200}', Spot: '{Neutral.700}', System: '{Neutral.800}'
		},
		Space: {
			'Space-0': '{Numbers.0}', 'Space-2': '{Numbers.2}', 'Space-4': '{Numbers.4}', 'Space-6': '{Numbers.6}', 'Space-8': '{Numbers.8}', 'Space-12': '{Numbers.12}', 'Space-14': '{Numbers.14}', 'Space-16': '{Numbers.16}', 'Space-20': '{Numbers.20}', 'Space-24': '{Numbers.24}', 'Space-32': '{Numbers.32}', 'Space-40': '{Numbers.40}', 'Space-48': '{Numbers.48}', 'Space-56': '{Numbers.56}', 'Space-64': '{Numbers.64}'
		},
		Radius: {
			'Radius-sm': '{Numbers.8}', 'Radius-md': '{Numbers.12}', 'Radius-l': '{Numbers.16}', 'Radius-xl': '{Numbers.24}', 'Radius-max': '{Numbers.64}', 'Radius-bottom-sheet': '{Numbers.24}'
		},
		Gradient: {
			600: '{Primary.600}', 
			'Gradient Purple': { 'Gradient Purple 600': '{Purple.600}' }, 
			'Logo Stroke Blue': '{Primary.600}', 'Logo Stroke White': '{Base.white}', 
			'Gradient grey 50': '{Base.white}', 'Gradient White': '{Base.white}', 
			'Gradient Grey 25': '{Neutral.25}',
			 
		},
		Logo: {
			'Logo Blue': '{Primary.600}', 'Logo Yellow': '{Orange.500}', 'Logo Pill Text': '{Base.white}'
		},
		Chat: {
			'Incoming message bubble': '{Neutral.50}', 'Incoming message text': '{Neutral.700}', 'Outgoing message bubble': '{Blue.500}', 'Outgoing message text': '{Blue.50}'
		},
		Stroke: {
			'stroke-01': '{Neutral.25}', 'Stroke-02': '{Neutral.50}'
		},
		Workspace: {
			'workspace card': '{Blue.500}', 'Workspace card text': '{Blue.50}', 'Workspace highlight 500': '{Primary.500}', 'Workspace spot': '{Blue.50}'
		},
		Alpha: { 'Alpha Grey 0': 'rgba(255, 255, 255, 0.0000)' } 
	},
	Dark: {
		Surface: {
			Primary: '{Neutral.950}', Foreground: '{Neutral.900}', Modal: '{Neutral.950}', Overlay: '{Neutral.700}', 'Modal Handle': '{Neutral.700}'
		}, 
		Button: {
			Primary: '{Base.white}', 'Primary Active': '{Primary.700}', 'Primary Disabled': '{Neutral.25}', Secondary: '{Primary.50}', Danger: '{Error.500}', 'Primary Text': '{Neutral.800}', 'Secondary Text': '{Primary.700}', 'Danger Text': '{Base.white}', 'Primary Disabled Text': '{Neutral.300}'
		},
		Typography: {
			Heading: '{Neutral.25}', Subtext: '{Neutral.200}', Body: '{Neutral.700}', Display: '#ffffff', Caption: '#ffffff', 'Decorated-Blue-Text': '{Neutral.200}'
		},
		Spot: {
			'Spot-500-Blue': '{Primary.100}', 'Spot-500-Green': '{Green.200}', 'Spot-500-Purple': '{Purple.200}', 'Spot-500-Red': '{Red.200}', 'Spot-500-Pink': '{Pink.200}', 'Spot-500-Yellow': '{Orange.100}', 'Spot-500-Neutral': '{Neutral.50}'
		},
		Highlight: {
			'Highlight Blue': { 50: '{Primary.700}', 100: '{Primary.900}', 500: '{Primary.300}' },
			'Highlight Green': { 50: '{Green.900}', 100: '{Green.700}', 500: '{Green.100}', 800: '{Green.50}' },
			'Highlight Purple': { 50: '{Purple.900}', 100: '{Purple.700}', 500: '{Purple.100}' },
			'Highlight Yellow': { 50: '{Orange.800}', 100: '{Orange.700}', 500: '{Orange.100}', 800: '{Orange.50}' },
			'Highlight Red': { 50: '{Red.900}', 100: '{Red.700}', 500: '{Red.100}', 800: '{Red.50}' },
			'HIghhlight Gray': { 50: '{Neutral.800}', 100: '{Neutral.600}', 500: '{Neutral.200}' },
			'Highlight Pink': { 50: '{Pink.900}', 100: '{Pink.700}', 500: '{Pink.100}' },
		},
		Icon: {
			Nav: '#ffffff', 'Nav Inactive': '{Neutral.400}', Spot: '{Neutral.600}', System: '#ffffff'
		},
		Space: {
			'Space-0': '{Numbers.0}', 'Space-2': '{Numbers.2}', 'Space-4': '{Numbers.4}', 'Space-6': '{Numbers.6}', 'Space-8': '{Numbers.8}', 'Space-12': '{Numbers.12}', 'Space-14': '{Numbers.14}', 'Space-16': '{Numbers.16}', 'Space-20': '{Numbers.20}', 'Space-24': '{Numbers.24}', 'Space-32': '{Numbers.32}', 'Space-40': '{Numbers.40}', 'Space-48': '{Numbers.48}', 'Space-56': '{Numbers.56}', 'Space-64': '{Numbers.64}'
		}, 
		Radius: {
			'Radius-sm': '{Numbers.8}', 'Radius-md': '{Numbers.12}', 'Radius-l': '{Numbers.14}', 'Radius-xl': '{Numbers.16}', 'Radius-max': '{Numbers.20}', 'Radius-bottom-sheet': '{Numbers.24}'
		},
		Gradient: {
			600: '{Neutral.900}', 'Gradient Purple': { 'Gradient Purple 600': '{Neutral.900}' }, 'Logo Stroke Blue': '{Neutral.900}', 'Logo Stroke White': '{Neutral.950}', 'Gradient grey 50': '{Neutral.50}', 'Gradient White': '{Neutral.950}', 'Gradient Grey 25': '{Neutral.900}'
		},
		Logo: {
			'Logo Blue': '{Base.white}', 'Logo Yellow': '{Base.white}', 'Logo Pill Text': '{Neutral.900}'
		},
		Chat: {
			'Incoming message bubble': '{Neutral.800}', 'Incoming message text': '{Neutral.100}', 'Outgoing message bubble': '{Blue.900}', 'Outgoing message text': '{Blue.100}'
		},
		Stroke: {
			'stroke-01': '{Neutral.900}', 'Stroke-02': '{Neutral.800}'
		},
		Workspace: {
			'workspace card': '{Neutral.950}', 'Workspace card text': '{Neutral.200}', 'Workspace highlight 500': '{Neutral.800}', 'Workspace spot': '{Neutral.50}'
		},
		Alpha: { 'Alpha Grey 0': 'rgba(19, 23, 52, 0.0000)' }
	}
};
