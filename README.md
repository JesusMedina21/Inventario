# Licoreria Inventario

Plataforma Web y Movil de control de Inventario para el Abasto y Licoreria Medina Ramirez. El Frontend fue desarrollado en Ionic con Angular y desplegado en Vercel. Se utilizo Firebase como Backend a traves de sus funcionalidades de BaaS como autenticacion de usuarios, Base de datos NoSQL, recuperacion de emails y contraseñas, envios de emails etc...  

## Funcionalidad

Esta plataforma te permite llevar el control del Inventario del Abasto y Licoreria Medina Ramirez, indicando la cantidad de mercancia actual, precios, dinero en Inventario etc... Incluye un apartado de Historial de movimientos con reportes en PDFs, que incluye los movimientos de salida y entrada de mercancia/productos. Tambien incluye generacion de reportes en PDF del stock actual de mercancia.

La web de la plataforma esta disponible en la siguiente url: https://licoreria-medinaramirez.vercel.app/

La aplicacion movil esta disponible en la siguiente url: https://drive.google.com/file/d/1bOU2TJ84dJc-XHuupTRq-Z9qMB9x7M5B/view?usp=drive_link

## Guía de instalación y ejecucion localmente del proyecto Ionic-Angular

## Instalaciones necesarias

- [Visual Studio Code](https://code.visualstudio.com/)
- [NodeJS v20 o mayor](https://nodejs.org/)

## Antes de comenzar

Antes de comenzar a instalar las dependencias del proyecto es necesario verificar que tienes las dependencias necesarias instaladas.
Abre la terminal de comandos de tu sistema y sigue los siguientes pasos para asegurarte de que todo está correcto antes de comenzar.

### Verificar instalación de NodeJS

```
node -v
```

- Verifica que tu versión de node sea una versión 20 o mayor, si no ve [al sitio oficial y descarga la última versión LTS](https://nodejs.org/)

### Verificar la política de ejecución de scripts

- Estaremos trabajando con Node para que Ionic funcione, por lo que vas a estar ejecutando comandos desde la consola/cmd. En el caso del sistema operativo Windows esto puede dar problemas debido a que la configuración para ejecutar comandos de herramientas externas está desactivado. Para activarlo sigue los siguientes pasos:

- Abre una terminal de Windows Powershell como administrador
- Ejecuta el siguiente comando:

```
Get-ExecutionPolicy -List
```

- Deberías ver algo como esto:

```
     Scope ExecutionPolicy
        ----- ---------------
MachinePolicy       Undefined
   UserPolicy       Undefined
      Process       Undefined
  CurrentUser       Restricted
 LocalMachine       Restricted
```

- La configuración que nos interesa es la de CurrentUser, debemos cambiarla a RemoteSigned, para ello, ejecuta el siguiente comando:

```
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

- Confirma la ejecución del comando
- Vuelve a comprobar la política de ejecución:

```
Get-ExecutionPolicy -List
```

- Deberías ver esto:

```
    Scope ExecutionPolicy
        ----- ---------------
MachinePolicy       Undefined
   UserPolicy       Undefined
      Process       Undefined
  CurrentUser       RemoteSigned
 LocalMachine       Restricted
```

### Comandos para instalar el proyecto


- Ejecuta el siguiente comando para instalar el proyecto:

```
npm install 
```
## Comando para ejecutar el proyecto

El proyeto está construido en Ionic con Angular y Firebase, para ejecutarlo debes ejecutar el siguiente comando:

```
ionic serve 
```

<h3 align="center">¡Listo! Has terminado de correr el proyecto 🥳</h3>


## Desarrollador por: Jesus Medina