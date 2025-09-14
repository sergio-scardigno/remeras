# 🏆 Catálogo de Camisetas Retro de Fútbol

[![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)

Un catálogo interactivo de camisetas retro de fútbol, construido con Next.js, TypeScript y MongoDB. Explora y descubre camisetas clásicas de diferentes equipos y épocas, con información detallada de jugadores y galerías de imágenes.

## 🚀 Características

- 📱 Interfaz moderna y responsiva
- 🔍 Navegación intuitiva por equipos y temporadas
- 👥 Información detallada de jugadores con sus números
- 🖼️ Galería de imágenes para cada camiseta
- ⚡ Rendimiento optimizado con Next.js

## 🛠️ Tecnologías

- **Frontend**: Next.js 13+ con App Router
- **Estilos**: Tailwind CSS
- **Tipado**: TypeScript
- **Base de datos**: MongoDB
- **Autenticación**: NextAuth.js (si es necesario)

## 🚀 Cómo comenzar

### Requisitos previos

- Node.js 18 o superior
- MongoDB Atlas o una instancia local de MongoDB
- npm o yarn

### Instalación

1. Clona el repositorio:
   ```bash
   git clone https://github.com/sergio-scardigno/remeras.git
   cd remeras
   ```

2. Instala las dependencias:
   ```bash
   npm install
   # o
   yarn install
   ```

3. Configura las variables de entorno:
   Crea un archivo `.env.local` en la raíz del proyecto con las siguientes variables:
   ```
   MONGODB_URI=tu_cadena_de_conexion_mongodb
   # Otras variables de entorno necesarias
   ```

4. Inicia el servidor de desarrollo:
   ```bash
   npm run dev
   # o
   yarn dev
   ```

5. Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## 🖥️ Estructura del proyecto

```
.
├── app/                  # Rutas de la aplicación
├── components/           # Componentes reutilizables
├── models/               # Modelos de MongoDB
├── pages/                # API Routes
├── public/               # Archivos estáticos
└── types/                # Definiciones de tipos TypeScript
```

## 🌐 Despliegue

Puedes desplegar este proyecto fácilmente en [Vercel](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme), la plataforma de los creadores de Next.js.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fsergio-scardigno%2Fremeras)

## 🤝 Contribuciones

¡Las contribuciones son bienvenidas! Siéntete libre de abrir un issue o enviar un pull request.

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Consulta el archivo `LICENSE` para más información.

## ✉️ Contacto

- GitHub: [@sergio-scardigno](https://github.com/sergio-scardigno)
- Proyecto: [Repositorio](https://github.com/sergio-scardigno/remeras)
