# Cobertura de historias de usuario

Esta matriz relaciona las 50 historias del documento de IHC con el prototipo funcional. El estado **Completada** significa que el flujo posee interfaz, validación, estado de éxito/error y persistencia mediante JSON Server o `localStorage`.

## Alcance del prototipo

- La videollamada se representa mediante una sala interactiva local; no transmite audio o video a terceros.
- La verificación de identidad valida formato y tamaño, registra una solicitud y cambia el estado a pendiente; la validación gubernamental es simulada.
- Las notificaciones y recordatorios se generan dentro de la aplicación; no se envían correos o notificaciones push reales.
- La cercanía usa distancias de prueba en `db.json`; no solicita GPS real al dispositivo.
- Las contraseñas son datos de demostración. Un producto real debe usar backend, hash y sesiones seguras.

## Matriz

| Historia | Capacidad implementada | Evidencia principal | Estado |
| --- | --- | --- | --- |
| US01 | Registro con campos obligatorios, correo único y créditos de bienvenida | `auth.html`, `auth.js`, colección `users` | Completada |
| US02 | Inicio de sesión válido, error de credenciales y cuenta demo | `auth.js`, `store.authenticate` | Completada |
| US03 | Edición validada de nombre, correo, distrito y biografía | `account.js`, diálogo `profile-dialog` | Completada |
| US04 | Agregar y quitar habilidades para enseñar | `account.js`, `skillsTeach` | Completada |
| US05 | Agregar y quitar intereses de aprendizaje | `account.js`, `skillsLearn` | Completada |
| US06 | Foto JPG/PNG/WEBP con validación de formato y 2 MB | `account.js`, `profile-photo` | Completada |
| US07 | Perfil de mentor con experiencia, reputación, sesiones, reseñas y disponibilidad | `mentor-dialog`, `community-safety.js` | Completada |
| US08 | Búsqueda por nombre o habilidad y estado sin resultados | `app.js`, vista Buscar | Completada |
| US09 | Filtro de cercanía y personas próximas | `app.js`, `community-safety.js` | Completada |
| US10 | Filtro y orden por calificación | `app.js`, `sort-filter` | Completada |
| US11 | Horarios disponibles y mensaje sin disponibilidad | `community-safety.js`, `availableSlots` | Completada |
| US12 | Filtro por modalidad virtual o presencial | `app.js`, `modality-filter` | Completada |
| US13 | Agregar, quitar y filtrar mentores favoritos | `community-safety.js`, colección `favorites` | Completada |
| US14 | Recomendaciones según intereses o alternativa general | `community-safety.js`, `skillsLearn` | Completada |
| US15 | Solicitud persistente con pregunta, horario y reserva de créditos | `workflows.js`, colección `mentorships` | Completada |
| US16 | Aceptación de solicitud y notificación al aprendiz | `workflows.js`, acción `accept` | Completada |
| US17 | Rechazo de solicitud y notificación | `workflows.js`, acción `reject` | Completada |
| US18 | Cancelación y actualización del estado | `workflows.js`, acción `cancel` | Completada |
| US19 | Selección de horario disponible | `time-options`, `workflows.js` | Completada |
| US20 | Sala virtual interactiva, estado en curso y controles | `session-room-dialog`, `workflows.js` | Completada (simulada) |
| US21 | Confirmación de ambas partes y estado completado idempotente | `completeSession`, `completionConfirmedBy` | Completada |
| US22 | Chat persistente asociado a la mentoría | `chat-dialog`, colección `messages` | Completada |
| US23 | Pregunta previa guardada en la solicitud | `prior-question`, `mentorships.priorQuestion` | Completada |
| US24 | Centro de notificaciones con lectura y eventos | `renderNotifications`, colección `notifications` | Completada |
| US25 | Confirmación de asistencia y aviso al mentor | `workflows.js`, acción `attendance` | Completada |
| US26 | Generación automática de recordatorios | `ensureReminders` | Completada (in-app) |
| US27 | Créditos asignados al mentor al completar | `completeSession`, colección `transactions` | Completada |
| US28 | Descuento y validación de saldo al solicitar | `requestMentorship`, `repeatSession` | Completada |
| US29 | Saldo actualizado en cabecera, inicio y créditos | `account.js`, `credits` | Completada |
| US30 | Historial persistente y filtro de movimientos | `renderTransactions`, vista Créditos | Completada |
| US31 | Bonificación de 10 créditos cada cinco mentorías | `completeSession`, transacción `bonus` | Completada |
| US32 | Calificación de una a cinco estrellas | `review-dialog`, `review-form` | Completada |
| US33 | Reseña escrita y persistente | `workflows.js`, colección `reviews` | Completada |
| US34 | Visualización de calificaciones y estado sin reseñas | `renderMentorProfileData` | Completada |
| US35 | Reporte de comportamiento asociado a un usuario | `report-dialog`, colección `reports` | Completada |
| US36 | Reputación recalculada después de cada reseña | `review-form`, campos `rating` y `reviewCount` | Completada |
| US37 | Solicitud de identidad con archivo válido/inválido | `identity-dialog`, `identityRequests` | Completada (simulada) |
| US38 | Consulta y selección persistente de lugar seguro | `safe-place-dialog`, `safePlaces` | Completada |
| US39 | Bloquear, listar y desbloquear usuarios | `community-safety.js`, `blockedUserIds` | Completada |
| US40 | Reporte general de incidente con categoría y descripción | `report-dialog`, colección `reports` | Completada |
| US41 | Recomendación automática según actividad e intereses | `renderRecommendationReason` | Completada |
| US42 | Historial de sesiones completadas y estado vacío | Vista Mentorías, pestaña Completadas | Completada |
| US43 | Repetir mentoría con el mismo mentor y validar saldo | `repeatSession` | Completada |
| US44 | Envío persistente de feedback | `feedback-dialog`, colección `feedback` | Completada |
| US45 | Envío persistente de sugerencias | `feedback-dialog`, tipo `suggestion` | Completada |
| US46 | Personas cercanas ordenadas por distancia | `renderNearbyUsers`, `distanceKm` | Completada (datos simulados) |
| US47 | Feed comunitario con publicaciones, reacciones y compartir | Vista Comunidad, `community-safety.js` | Completada |
| US48 | Tendencias ordenadas y estado sin datos | `renderPopularSkills`, `popularSkills` | Completada |
| US49 | Publicación persistente de logros | `achievement-dialog`, colección `achievements` | Completada |
| US50 | Creación y copia de invitación | `copy-invite`, colección `invitations` | Completada |

## Verificación

Ejecutar:

```bash
npm test
```

La prueba valida `db.json`, la sintaxis de todos los scripts y la presencia de las 50 historias en esta matriz.
