module.exports = {
  mode: 'jit',
  purge: ['./pages/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  safelist: [
    'bg-white', 'bg-transparent', 'bg-slate-100',
    'text-slate-900', 'text-slate-500',
    'shadow', 'rounded-lg', 'rounded-md',
    'flex-1', 'gap-1',
  ],
  darkMode: false, // or 'media' or 'class'
  theme: {
      extend: {},
  },
  variants: {
      extend: {},
  },
  plugins: [],
};
