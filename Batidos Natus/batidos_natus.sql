-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 07-07-2026 a las 04:15:16
-- Versión del servidor: 10.4.32-MariaDB
-- Versión de PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `batidos_natus`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `configuracion`
--

CREATE TABLE `configuracion` (
  `id_config` int(11) NOT NULL,
  `clave` varchar(50) NOT NULL,
  `valor` text NOT NULL,
  `descripcion` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `configuracion`
--

INSERT INTO `configuracion` (`id_config`, `clave`, `valor`, `descripcion`) VALUES
(1, 'nombre_negocio', 'Batidos-Natus', 'Nombre del negocio'),
(2, 'telefono_contacto', '+58 412-1234567', 'Teléfono de contacto'),
(3, 'horario_atencion', 'Lun-Sáb 8am-8pm', 'Horario de atención'),
(4, 'impuesto_porcentaje', '0.00', 'Impuesto aplicado');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `detalle_factura`
--

CREATE TABLE `detalle_factura` (
  `id_detalle_factura` int(11) NOT NULL,
  `id_factura` int(11) NOT NULL,
  `id_producto` int(11) NOT NULL,
  `nombre_producto` varchar(100) NOT NULL,
  `cantidad` int(11) NOT NULL,
  `precio_unitario` decimal(10,2) NOT NULL,
  `subtotal` decimal(10,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `detalle_factura`
--

INSERT INTO `detalle_factura` (`id_detalle_factura`, `id_factura`, `id_producto`, `nombre_producto`, `cantidad`, `precio_unitario`, `subtotal`) VALUES
(1, 1, 4, 'Coco Playa', 1, 4.80, 4.80),
(2, 1, 1, 'Frutas del Bosque', 1, 4.50, 4.50),
(4, 2, 2, 'Mango Pasión', 1, 4.20, 4.20),
(5, 2, 5, 'Proteína Energía', 1, 5.50, 5.50),
(6, 3, 6, 'Tropical Sunrise', 1, 4.90, 4.90),
(7, 4, 6, 'Tropical Sunrise', 1, 4.90, 4.90),
(8, 4, 2, 'Mango Pasión', 1, 4.20, 4.20),
(9, 5, 1, 'Frutas del Bosque', 1, 4.50, 4.50),
(10, 6, 8, 'Sol Carmesí', 1, 3.70, 3.70),
(11, 7, 9, 'Terciopelo Rosa', 1, 4.10, 4.10),
(12, 7, 8, 'Sol Carmesí', 1, 3.70, 3.70);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `detalle_pedido`
--

CREATE TABLE `detalle_pedido` (
  `id_detalle` int(11) NOT NULL,
  `id_pedido` int(11) NOT NULL,
  `id_producto` int(11) NOT NULL,
  `cantidad` int(11) NOT NULL,
  `precio_unitario` decimal(10,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `detalle_pedido`
--

INSERT INTO `detalle_pedido` (`id_detalle`, `id_pedido`, `id_producto`, `cantidad`, `precio_unitario`) VALUES
(4, 15, 9, 1, 4.10),
(5, 15, 8, 1, 3.70);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `facturas`
--

CREATE TABLE `facturas` (
  `id_factura` int(11) NOT NULL,
  `id_pedido` int(11) NOT NULL,
  `id_usuario` int(11) NOT NULL,
  `numero_factura` varchar(20) NOT NULL,
  `fecha_emision` timestamp NOT NULL DEFAULT current_timestamp(),
  `subtotal` decimal(10,2) NOT NULL,
  `impuesto` decimal(10,2) DEFAULT 0.00,
  `total` decimal(10,2) NOT NULL,
  `monto_bs` decimal(10,2) DEFAULT NULL,
  `metodo_pago` enum('efectivo','tarjeta','transferencia') NOT NULL,
  `estado_pago` enum('pendiente','pagado','cancelado') DEFAULT 'pagado',
  `referencia_pago` varchar(100) DEFAULT NULL,
  `observaciones` text DEFAULT NULL,
  `creado_por` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `facturas`
--

INSERT INTO `facturas` (`id_factura`, `id_pedido`, `id_usuario`, `numero_factura`, `fecha_emision`, `subtotal`, `impuesto`, `total`, `monto_bs`, `metodo_pago`, `estado_pago`, `referencia_pago`, `observaciones`, `creado_por`) VALUES
(1, 1, 3, 'FAC-2026-0001', '2026-06-29 17:19:34', 9.30, 0.00, 9.30, NULL, '', 'pagado', NULL, NULL, 'empleado1'),
(2, 2, 3, 'FAC-2026-0002', '2026-06-29 17:48:18', 9.70, 0.00, 9.70, NULL, '', 'pagado', NULL, NULL, 'empleado1'),
(3, 5, 3, 'FAC-2026-0003', '2026-06-30 20:38:52', 4.90, 0.00, 4.90, NULL, '', 'pagado', NULL, NULL, 'empleado1'),
(4, 7, 3, 'FAC-2026-0004', '2026-07-02 04:15:21', 9.10, 0.00, 9.10, NULL, '', 'pagado', NULL, '| Monto en Bs.: 5,821.30 Bs.', 'empleado1'),
(5, 8, 3, 'FAC-2026-0005', '2026-07-03 05:03:46', 4.50, 0.00, 4.50, NULL, '', 'pagado', NULL, '| Monto en Bs.: 2,938.38 Bs.', 'empleado1'),
(6, 9, 3, 'FAC-2026-0006', '2026-07-04 05:47:20', 3.70, 0.00, 3.70, NULL, 'transferencia', 'pagado', NULL, 'notas', 'empleado1'),
(7, 15, 3, 'FAC-2026-0007', '2026-07-07 02:00:54', 7.80, 0.00, 7.80, NULL, '', 'pagado', NULL, 'notas', 'empleado1');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `movimientos_stock`
--

CREATE TABLE `movimientos_stock` (
  `id_movimiento` int(11) NOT NULL,
  `id_producto` int(11) NOT NULL,
  `tipo` enum('venta','ajuste','compra','devolucion') NOT NULL,
  `cantidad` int(11) NOT NULL,
  `stock_anterior` int(11) NOT NULL,
  `stock_nuevo` int(11) NOT NULL,
  `referencia` varchar(50) DEFAULT NULL,
  `usuario` varchar(50) DEFAULT NULL,
  `fecha` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `pagos`
--

CREATE TABLE `pagos` (
  `id_pago` int(11) NOT NULL,
  `id_factura` int(11) NOT NULL,
  `id_pedido` int(11) NOT NULL,
  `id_usuario` int(11) NOT NULL,
  `monto` decimal(10,2) NOT NULL,
  `metodo` enum('tarjeta','efectivo','transferencia','paypal') NOT NULL,
  `estado` enum('pendiente','aprobado','rechazado','cancelado') DEFAULT 'pendiente',
  `transaccion_id` varchar(100) DEFAULT NULL,
  `fecha_pago` timestamp NOT NULL DEFAULT current_timestamp(),
  `ip_cliente` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `pedidos`
--

CREATE TABLE `pedidos` (
  `id_pedido` int(11) NOT NULL,
  `id_usuario` int(11) NOT NULL,
  `numero_pedido` varchar(20) DEFAULT NULL,
  `fecha` timestamp NOT NULL DEFAULT current_timestamp(),
  `total` decimal(10,2) NOT NULL,
  `estado` enum('Pendiente','Pagado','Cancelado') DEFAULT 'Pendiente',
  `metodo_pago` enum('efectivo','tarjeta','transferencia') DEFAULT 'efectivo',
  `direccion` varchar(255) DEFAULT NULL,
  `observaciones` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `pedidos`
--

INSERT INTO `pedidos` (`id_pedido`, `id_usuario`, `numero_pedido`, `fecha`, `total`, `estado`, `metodo_pago`, `direccion`, `observaciones`) VALUES
(1, 3, '#BAT-0001', '2026-06-29 17:18:19', 9.30, 'Pagado', '', NULL, ''),
(2, 3, '#BAT-0002', '2026-06-29 17:47:44', 9.70, 'Pagado', '', NULL, ''),
(3, 3, '#BAT-0003', '2026-06-30 18:57:36', 5.00, 'Cancelado', 'efectivo', NULL, ''),
(4, 3, '#BAT-0004', '2026-06-30 19:00:20', 4.90, 'Cancelado', 'efectivo', NULL, ''),
(5, 3, '#BAT-0005', '2026-06-30 20:38:00', 4.90, 'Pagado', '', NULL, ''),
(6, 3, '#BAT-0006', '2026-06-30 20:39:30', 4.50, 'Cancelado', 'efectivo', NULL, ''),
(7, 3, '#BAT-0007', '2026-07-02 03:41:37', 9.10, 'Pagado', '', NULL, ''),
(8, 3, '#BAT-0008', '2026-07-03 04:21:18', 4.50, 'Pagado', '', NULL, ''),
(9, 3, '#BAT-0009', '2026-07-04 05:46:31', 3.70, 'Pagado', 'transferencia', NULL, ''),
(15, 3, '#BAT-0015', '2026-07-07 01:59:55', 7.80, 'Pagado', '', NULL, '');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `productos`
--

CREATE TABLE `productos` (
  `id_producto` int(11) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `categoria` varchar(50) DEFAULT 'Frutales',
  `precio` decimal(10,2) NOT NULL,
  `stock` int(11) NOT NULL DEFAULT 0,
  `imagen_url` varchar(255) DEFAULT NULL,
  `activo` tinyint(1) DEFAULT 1,
  `creado_en` timestamp NOT NULL DEFAULT current_timestamp(),
  `actualizado_en` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `productos`
--

INSERT INTO `productos` (`id_producto`, `nombre`, `descripcion`, `categoria`, `precio`, `stock`, `imagen_url`, `activo`, `creado_en`, `actualizado_en`) VALUES
(1, 'Frutas del Bosque', 'Arándanos, frambuesas, moras y yogurt natural.', 'Frutales', 4.50, 50, 'img/frutas-del-bosque.jpg', 1, '2026-06-24 20:51:24', '2026-07-05 21:02:42'),
(2, 'Mango Pasión', 'Mango maduro con maracuyá y un toque de miel.', 'Frutales', 4.20, 49, 'img/mango-pasion.jpg', 1, '2026-06-24 20:51:24', '2026-07-02 04:15:21'),
(3, 'Verde Detox', 'Espinacas, manzana verde, pepino y una pizca de jengibre y limón.', 'Detox', 5.00, 50, 'img/verde-detox.jpg', 1, '2026-06-24 20:51:24', '2026-07-04 06:16:31'),
(4, 'Coco Playa', 'Agua y pulpa de coco con piña y ralladura de coco.', 'Frutales', 4.80, 50, 'img/coco-playa.jpg', 1, '2026-06-24 20:51:24', '2026-06-30 20:01:44'),
(5, 'Proteína Energía', 'Banana, avena, proteína vegana y almendras.', 'Energéticos', 5.50, 50, 'img/proteina-energia.jpg', 1, '2026-06-24 20:51:24', '2026-07-04 06:16:31'),
(6, 'Tropical Sunrise', 'Naranja y zanahoria con jengibre y cúrcuma.', 'Frutales', 4.90, 48, 'img/tropical-sunrise.jpg', 1, '2026-06-24 20:51:24', '2026-07-02 04:15:21'),
(8, 'Sol Carmesí', 'Guayaba con remolacha y pimentón rojo.', 'Energéticos', 3.70, 38, 'img/productos/sol-carmes--1783143946.jpg', 1, '2026-07-04 05:45:46', '2026-07-07 02:00:54'),
(9, 'Terciopelo Rosa', 'Guanabana con fresas, leche y semillas de chía.', 'Proteicos', 4.10, 44, 'img/productos/terciopelo-rosa-1783230621.jpg', 1, '2026-07-05 05:50:21', '2026-07-07 02:00:54');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `usuarios`
--

CREATE TABLE `usuarios` (
  `id_usuario` int(11) NOT NULL,
  `nombre` varchar(50) NOT NULL,
  `correo` varchar(100) DEFAULT NULL,
  `contrasena` varchar(255) NOT NULL,
  `rol` enum('cliente','admin','empleado') DEFAULT 'cliente',
  `fecha_registro` timestamp NOT NULL DEFAULT current_timestamp(),
  `activo` tinyint(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `usuarios`
--

INSERT INTO `usuarios` (`id_usuario`, `nombre`, `correo`, `contrasena`, `rol`, `fecha_registro`, `activo`) VALUES
(1, 'admin', NULL, '$2y$10$S9G7P83PiNPGYyUAPF5bSOZrV7PkxtTpQJEmTdYMLG2V00lxXL3Tm', 'admin', '2026-06-24 20:51:24', 1),
(2, 'empleado1', NULL, '$2y$10$MKXTi0DCgeF.cOULJ9gIoeWgWj9.KN1wlEhlKetHIbabY5CW5YQ3O', 'empleado', '2026-06-24 20:51:24', 1),
(3, 'cliente1', NULL, '$2y$10$9OgvwOQs82NFFWL.INKluu351OHDPBsXwwhfe2wTNsDVOd1UDP6yi', 'cliente', '2026-06-24 20:51:24', 1),
(4, 'ana', NULL, '$2y$10$zl1xHIuRwKzFfIXbBrFtb.9LaPWEWp9SBgN2EP8dpvV3rRnj3Graa', 'cliente', '2026-06-24 20:51:24', 1),
(5, 'juan', NULL, '$2y$10$IpRftrgtOnKT0h3oN4XXp.I11HXRzhxknhOlX4/BeS1G70p05npFu', 'cliente', '2026-06-24 20:51:24', 1),
(6, 'SusyW27', NULL, '$2y$10$qMtchN1y2ccBg9TDOcOvX.MlG3lMGWfr6HdgWJWnkPB.2RFFYeU1W', 'cliente', '2026-06-25 13:58:32', 1);

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `configuracion`
--
ALTER TABLE `configuracion`
  ADD PRIMARY KEY (`id_config`),
  ADD UNIQUE KEY `clave` (`clave`);

--
-- Indices de la tabla `detalle_factura`
--
ALTER TABLE `detalle_factura`
  ADD PRIMARY KEY (`id_detalle_factura`),
  ADD KEY `id_factura` (`id_factura`),
  ADD KEY `id_producto` (`id_producto`);

--
-- Indices de la tabla `detalle_pedido`
--
ALTER TABLE `detalle_pedido`
  ADD PRIMARY KEY (`id_detalle`),
  ADD KEY `id_pedido` (`id_pedido`),
  ADD KEY `id_producto` (`id_producto`);

--
-- Indices de la tabla `facturas`
--
ALTER TABLE `facturas`
  ADD PRIMARY KEY (`id_factura`),
  ADD UNIQUE KEY `numero_factura` (`numero_factura`),
  ADD KEY `id_pedido` (`id_pedido`),
  ADD KEY `id_usuario` (`id_usuario`);

--
-- Indices de la tabla `movimientos_stock`
--
ALTER TABLE `movimientos_stock`
  ADD PRIMARY KEY (`id_movimiento`),
  ADD KEY `id_producto` (`id_producto`);

--
-- Indices de la tabla `pagos`
--
ALTER TABLE `pagos`
  ADD PRIMARY KEY (`id_pago`),
  ADD KEY `id_factura` (`id_factura`),
  ADD KEY `id_pedido` (`id_pedido`),
  ADD KEY `id_usuario` (`id_usuario`);

--
-- Indices de la tabla `pedidos`
--
ALTER TABLE `pedidos`
  ADD PRIMARY KEY (`id_pedido`),
  ADD UNIQUE KEY `numero_pedido` (`numero_pedido`),
  ADD KEY `id_usuario` (`id_usuario`);

--
-- Indices de la tabla `productos`
--
ALTER TABLE `productos`
  ADD PRIMARY KEY (`id_producto`);

--
-- Indices de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  ADD PRIMARY KEY (`id_usuario`),
  ADD UNIQUE KEY `nombre` (`nombre`),
  ADD UNIQUE KEY `correo` (`correo`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `configuracion`
--
ALTER TABLE `configuracion`
  MODIFY `id_config` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT de la tabla `detalle_factura`
--
ALTER TABLE `detalle_factura`
  MODIFY `id_detalle_factura` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT de la tabla `detalle_pedido`
--
ALTER TABLE `detalle_pedido`
  MODIFY `id_detalle` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT de la tabla `facturas`
--
ALTER TABLE `facturas`
  MODIFY `id_factura` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT de la tabla `movimientos_stock`
--
ALTER TABLE `movimientos_stock`
  MODIFY `id_movimiento` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `pagos`
--
ALTER TABLE `pagos`
  MODIFY `id_pago` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `pedidos`
--
ALTER TABLE `pedidos`
  MODIFY `id_pedido` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT de la tabla `productos`
--
ALTER TABLE `productos`
  MODIFY `id_producto` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  MODIFY `id_usuario` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `detalle_factura`
--
ALTER TABLE `detalle_factura`
  ADD CONSTRAINT `detalle_factura_ibfk_1` FOREIGN KEY (`id_factura`) REFERENCES `facturas` (`id_factura`) ON DELETE CASCADE,
  ADD CONSTRAINT `detalle_factura_ibfk_2` FOREIGN KEY (`id_producto`) REFERENCES `productos` (`id_producto`);

--
-- Filtros para la tabla `detalle_pedido`
--
ALTER TABLE `detalle_pedido`
  ADD CONSTRAINT `detalle_pedido_ibfk_1` FOREIGN KEY (`id_pedido`) REFERENCES `pedidos` (`id_pedido`) ON DELETE CASCADE,
  ADD CONSTRAINT `detalle_pedido_ibfk_2` FOREIGN KEY (`id_producto`) REFERENCES `productos` (`id_producto`) ON DELETE CASCADE;

--
-- Filtros para la tabla `facturas`
--
ALTER TABLE `facturas`
  ADD CONSTRAINT `facturas_ibfk_1` FOREIGN KEY (`id_pedido`) REFERENCES `pedidos` (`id_pedido`) ON DELETE CASCADE,
  ADD CONSTRAINT `facturas_ibfk_2` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`);

--
-- Filtros para la tabla `movimientos_stock`
--
ALTER TABLE `movimientos_stock`
  ADD CONSTRAINT `movimientos_stock_ibfk_1` FOREIGN KEY (`id_producto`) REFERENCES `productos` (`id_producto`) ON DELETE CASCADE;

--
-- Filtros para la tabla `pagos`
--
ALTER TABLE `pagos`
  ADD CONSTRAINT `pagos_ibfk_1` FOREIGN KEY (`id_factura`) REFERENCES `facturas` (`id_factura`),
  ADD CONSTRAINT `pagos_ibfk_2` FOREIGN KEY (`id_pedido`) REFERENCES `pedidos` (`id_pedido`),
  ADD CONSTRAINT `pagos_ibfk_3` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`);

--
-- Filtros para la tabla `pedidos`
--
ALTER TABLE `pedidos`
  ADD CONSTRAINT `pedidos_ibfk_1` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
