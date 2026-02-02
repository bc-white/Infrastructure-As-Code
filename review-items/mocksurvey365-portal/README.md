# Omcura

A modern React application built with TypeScript, Vite, and Tailwind CSS.

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/Omcura.git
cd Omcura
```

2. Install dependencies:

```bash
npm install
# or
yarn install
```

3. Create a `.env` file in the root directory with the following variables:

```env
# API Configuration
VITE_API_BASE_URL=https://api.yourdomain.com

```

> **Important**: Never commit the `.env` file to version control. The `.env.example` file is provided as a template.

4. Start the development server:

```bash
npm run dev
# or
yarn dev
```

## 🛠️ Tech Stack

- **Framework**: React with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Form Handling**: React Hook Form with Zod validation
- **Routing**: React Router
- **HTTP Client**: Axios
- **Date Handling**: date-fns
- **Icons**: Lucide React

## 📁 Project Structure

````

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

## 🧪 Environment Variables

The application uses Vite's environment variables system. All environment variables must be prefixed with `VITE_` to be exposed to the client-side code.

You can access these variables in your code using:
```typescript
import.meta.env.VITE_API_URL
````

## 📝 TypeScript Configuration

The project uses TypeScript with strict mode enabled. Path aliases are configured for better import management:

```typescript
// Example of using path aliases
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
```
