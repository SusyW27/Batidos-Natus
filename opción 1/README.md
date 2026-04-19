# 🥤 Batidos-Natus | Tienda de Batidos Naturales

[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![GitHub stars](https://img.shields.io/github/stars/SusyW27/batidos-natus)](https://github.com/SusyW27/batidos-natus/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/SusyW27/batidos-natus)](https://github.com/SusyW27/batidos-natus/network)

> **Sistema completo de e-commerce** para una tienda de batidos naturales con autenticación de usuarios, carrito de compras persistente y catálogo de productos. Desarrollado con HTML5, CSS3 y JavaScript vanilla.

## 📋 Tabla de Contenidos
- [Demo](#-demo)
- [Características](#-características)
- [Tecnologías](#-tecnologías)
- [Arquitectura](#-arquitectura)
- [Base de Datos](#-base-de-datos)
- [Instalación](#-instalación)
- [Uso](#-uso)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Flujo de Trabajo](#-flujo-de-trabajo)
- [Contribuciones](#-contribuciones)
- [Licencia](#-licencia)

## 🎯 Demo

**Credenciales de prueba:**
- Usuario: `cliente1` | Contraseña: `batido123`
- Usuario: `ana` | Contraseña: `natural`
- Usuario: `juan` | Contraseña: `fruta`

## ✨ Características

### 🔐 Sistema de Autenticación
- Registro de nuevos usuarios con validación
- Inicio de sesión seguro
- Persistencia de sesión con localStorage
- Cierre de sesión automático

### 🛒 Gestión de Compras
- Catálogo de 6 batidos naturales
- Agregar/eliminar productos del carrito
- Ajuste de cantidades por producto
- Cálculo automático del total
- Proceso de checkout simulado
- Carritos independientes por usuario

### 🎨 Interfaz de Usuario
- Diseño moderno con efecto glassmorphism
- Paleta de colores naturales (verde/naranja)
- Animaciones y transiciones suaves
- Responsive para móviles, tablets y desktop
- Feedback visual en todas las acciones

## 🛠️ Tecnologías

| Tecnología | Descripción |
|------------|-------------|
| **HTML5** | Estructura semántica del documento |
| **CSS3** | Estilos con Flexbox, Grid, animaciones |
| **JavaScript ES6+** | Lógica de negocio, manipulación del DOM |
| **LocalStorage API** | Persistencia de datos (usuarios, carritos) |

## 🏗️ Arquitectura

### Patrón de Diseño
El proyecto sigue una arquitectura modular basada en **separación de responsabilidades**:
