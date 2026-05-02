const express = require('express')
require('dotenv').config()
const app = express();
const mysql = require('mysql2')
const cors = require('cors')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
console.log(process.env.HOST_MYSQL, process.env.USER_MYSQL, process.env.PORT_MYSQL)

const JWT_SECRET = process.env.JWT

app.use(cors());
app.use(express.json())

const db = mysql.createPool({
  host: process.env.HOST_MYSQL,
  user: process.env.USER_MYSQL,
  password: process.env.PASSWORD_MYSQL,
  database: process.env.DATABASE_MYSQL,
  port: process.env.PORT_MYSQL,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

db.getConnection((err, connection) => {
  if (err) {
    console.error("Error conectando a MySQL:", err);
  } else {
    console.log("Conectado a MySQL");
    connection.release();
  }
});

app.get("/", (req, res) => {
  res.send("API funcionando");
});


app.post("/api/register", async (req, res) => {
  const { usuario, password, privilegio, nombre, apellido, telefono } = req.body

  const hashedPassword = await bcrypt.hash(password, 10)

  db.query(
    "INSERT INTO usuarios (usuario, contrasena, rol, nombre, apellido, telefono) VALUES (?, ?, ?, ?, ?, ?)",
    [usuario, hashedPassword, privilegio, nombre, apellido, telefono],
    (err) => {
      if (err) return res.status(500).send(err)
      res.send("Usuario creado")
    }
  )
})

//validacion backend

app.post("/api/login", (req, res) => {
  const { usuario, pass } = req.body

  db.query(
    "SELECT * FROM usuarios WHERE usuario = ?",
    [usuario],
    async (err, result) => {
      if (err) return res.status(500).send(err)
      if (result.length === 0)
        return res.status(401).json({ok: false, message:"Usuario no existe"})

      const user = result[0]

      const isValid = await bcrypt.compare(pass, user.contrasena)
      if (!isValid)
        return res.status(401).json({ok: false, message:"Contraseña incorrecta"})

      const token = jwt.sign(
        { id: user.id, rol: user.rol },
        JWT_SECRET,
        { expiresIn: "1h" }
      )

      res.json({ ok:true, token, name:user.nombre, lastname:user.apellido, role: user.rol})
    }
  )
})




app.post("/api/create", (req, res)=>{
    const codigo = req.body.codigo;
    const nombre = req.body.nombre;
    const precio = req.body.precio;
    const stock = req.body.stock;
    const categoria = req.body.categoria;
    const proveedor = req.body.proveedor;

    db.query('INSERT INTO productos (codigo, nombre, precio, stock, categoria, proveedor) VALUES (?, ?, ?, ?, ?, ?)', [codigo, nombre, precio, stock, categoria, proveedor],
        (err, result) => {
            if(err){
                console.log("Ocurrió un error:",err)
            }else{
                res.send("Producto registrado con éxito!")
            }
        }
    );

});


app.put("/api/update/:id", (req, res)=>{
     const { id } = req.params;
    const codigo = req.body.codigo;
    const nombre = req.body.nombre;
    const precio = req.body.precio;
    const stock = req.body.stock;
    const categoria = req.body.categoria;
    const proveedor = req.body.proveedor;


    db.query('UPDATE productos SET codigo = ?, nombre = ?, precio = ?, stock = ?, categoria = ?, proveedor = ? WHERE id_producto = ?', [codigo, nombre, precio, stock, categoria, proveedor, id],
        (err, result) => {
            if(err){
                console.log("Ocurrió un error:",err)
            }else{
                res.send("Producto actualizado con éxito!")
            }
        }
    );

});

//end point update_usuarios 

app.put("/api/update_us/:id", (req, res)=>{
     const { id } = req.params;
    const nombre = req.body.nombre;
    const apellido = req.body.apellido;
    const usuario = req.body.usuario;
    const telefono = req.body.telefono;
    const rol = req.body.rol;
    


    db.query('UPDATE usuarios SET nombre = ?, apellido = ?, usuario = ?, telefono = ?, rol = ? WHERE id_usuario = ?', [nombre, apellido, usuario, telefono, rol, id],
        (err, result) => {
            if(err){
                console.log("Ocurrió un error:",err)
            }else{
                res.send("Usuario actualizado con éxito!")
            }
        }
    );

});

app.get("/api/venta/productos/:codigo", (req, res)=>{
     const { codigo } = req.params;



    db.query('SELECT * FROM productos WHERE codigo LIKE ? OR nombre LIKE ? ',  [`%${codigo}%`, `%${codigo}%`], 
        (err, result) => {
            if(err){
                console.log("Ocurrió un error:",err)
            }else{
                res.send(result)
            }
        }
    );


});



app.delete("/api/delete/:id", (req, res)=>{
     const { id } = req.params;


    db.query('DELETE FROM productos  WHERE id_producto = ?', [id],
        (err, result) => {
            if(err){
                console.log("Ocurrió un error:",err)
            }else{
                res.send("Producto eliminado con éxito!")
            }
        }
    );

});


app.delete("/api/delete_user/:id", (req, res)=>{
     const { id } = req.params;


    db.query('DELETE FROM usuarios  WHERE id_usuario = ?', [id],
        (err, result) => {
            if(err){
                console.log("Ocurrió un error:",err)
            }else{
                res.send("success")
            }
        }
    );

});

app.get("/api/productos", (req, res) => {
  const search = `%${req.query.search || ""}%`;
const limit = parseInt(req.query.limit) || 10;
const offset = ((parseInt(req.query.page) || 1) - 1) * limit;

const dataQuery = `
  SELECT * FROM productos
  WHERE nombre LIKE ? OR codigo LIKE ?
  LIMIT ? OFFSET ?
`;

db.query(dataQuery, [search, search, limit, offset], (err, results) => {
  if (err) {
    console.error(err);
    return res.status(500).json({ error: "Error al obtener productos" });
  }

  // si quieres total de registros para paginación
  db.query(
    `SELECT COUNT(*) as total FROM productos WHERE nombre LIKE ? OR codigo LIKE ?`,
    [search, search],
    (errCount, countResult) => {
      if (errCount) return res.status(500).json({ error: "Error conteo" });
      const total = countResult[0].total;
      const totalPages = Math.ceil(total / limit);
      res.json({ data: results, totalPages });
    }
  );
});
});


app.get("/api/usuarios", (req, res)=>{



    db.query("SELECT id_usuario, rol, nombre, apellido, telefono FROM usuarios",
        (err, result) => {
           if(err){
            console.log(err);
            res.status(400).json({error: "Base de datos no encontrada!"})
           }else{
            res.send(result)
           }
        }
    )
})

//Endpoint historial de ventas
// Endpoint historial de ventas
app.get("/api/ventas", (req, res) => {
  const search = req.query.search || "";           // Puede ser número o texto
  const startDate = req.query.start || "1900-01-01";
  const endDate = req.query.end || "2100-12-31";
  const limit = parseInt(req.query.limit) || 5;
  const page = parseInt(req.query.page) || 1;
  const offset = (page - 1) * limit;

  let dataQuery = "";
  let countQuery = "";
  let paramsData = [];
  let paramsCount = [];

  // Si hay search numérico (id_venta)
  if (search && !isNaN(search)) {
    dataQuery = `
      SELECT id_venta,
             DATE_FORMAT(fecha, '%Y-%m-%d %H:%i:%s') as fecha,
             usuario,
             total,
             tipo_documento,
             impuesto,
             subTotal
      FROM ventas
      WHERE id_venta = ?
      LIMIT ? OFFSET ?
    `;
    paramsData = [search, limit, offset];

    countQuery = `
      SELECT COUNT(*) as total
      FROM ventas
      WHERE id_venta = ?
    `;
    paramsCount = [search];
  } else {
    // Si no hay search, filtrar por fecha
    dataQuery = `
      SELECT id_venta,
             DATE_FORMAT(fecha, '%Y-%m-%d %H:%i:%s') as fecha,
             usuario,
             total,
             tipo_documento,
             impuesto,
             subTotal
      FROM ventas
      WHERE DATE(fecha) BETWEEN ? AND ?
      LIMIT ? OFFSET ?
    `;
    paramsData = [startDate, endDate, limit, offset];

    countQuery = `
      SELECT COUNT(*) as total
      FROM ventas
      WHERE DATE(fecha) BETWEEN ? AND ?
    `;
    paramsCount = [startDate, endDate];
  }

  // Consulta principal
  db.query(dataQuery, paramsData, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Error al obtener datos" });
    }

    // Consulta total para paginación
    db.query(countQuery, paramsCount, (errCount, countResult) => {
      if (errCount) {
        console.error(errCount);
        return res.status(500).json({ error: "Error conteo" });
      }
      const total = countResult[0].total;
      const totalPages = Math.ceil(total / limit);

      res.json({ data: results, totalPages });
    });
  });
});

//Endpoint info idProductos vendidos

app.get("/api/ventas/ver/:idVenta", (req, res) => {
  const { idVenta } = req.params;

  const queryVenta = `
    SELECT * 
    FROM ventas 
    WHERE id_venta = ?
  `;


  const queryDetalle = `
    SELECT 
      d.idProducto,
      p.nombre,
      d.cantidad,
      d.precio,
      (d.cantidad * d.precio) AS total
    FROM detalle_venta d
    INNER JOIN productos p 
      ON p.id_producto = d.idProducto
    WHERE d.idVenta = ?
  `;

  db.query(queryVenta, [idVenta], (err, ventaResult) => {
    if (err) return res.status(500).send(err);

    if (ventaResult.length === 0) {
      return res.status(404).send({ message: "Venta no encontrada" });
    }

    db.query(queryDetalle, [idVenta], (err2, detalleResult) => {
      if (err2) return res.status(500).send(err2);

      res.send({
        ...ventaResult[0],
        detalle: detalleResult
      });
    });
  });
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
    console.log(`Puerto ${PORT} a la escucha`)
})

//api ventas

app.post('/api/venta/registrar', (req, res) => {

  let { tipoDocumento, subTotal, igv, total, listaProductos, usuario } = req.body;

  // Iniciar transacción
  db.query('START TRANSACTION', (err) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ numeroDocumento: "" });
    }

    // Insertar venta
    db.query(
      `INSERT INTO ventas (tipo_documento, subTotal, impuesto, total, usuario) VALUES (?, ?, ?, ?, ?)`,
      [tipoDocumento, subTotal, igv, total, usuario],
      (err, result) => {
        if (err) {
          console.error(err);
          return db.query('ROLLBACK', () => res.status(500).json({ numeroDocumento: "" }));
        }

        const idVenta = result.insertId;

        // 🔴 Validación extra por seguridad
        if (!idVenta) {
          return db.query('ROLLBACK', () => res.status(500).json({ numeroDocumento: "" }));
        }

        const numeroDocumento = idVenta.toString().padStart(6, '0');

        // Si no hay productos
        if (!Array.isArray(listaProductos) || listaProductos.length === 0) {
          return db.query('COMMIT', (err) => {
            if (err) {
              console.error(err);
              return db.query('ROLLBACK', () => res.status(500).json({ numeroDocumento: "" }));
            }
            return res.json({ numeroDocumento });
          });
        }

        let insertCount = 0;
        let errorInsert = false;

        listaProductos.forEach((item) => {

          // 1. Insertar detalle
          db.query(
            `INSERT INTO detalle_venta (idVenta, idProducto, cantidad, precio, total) VALUES (?, ?, ?, ?, ?)`,
            [idVenta, item.id_producto, item.cantidad, item.precio, item.total],
            (err) => {

              if (err) {
                console.error(err);
                errorInsert = true;
                insertCount++;
              } else {

                // 2. Descontar stock
                db.query(
                  `UPDATE productos 
                   SET stock = stock - ? 
                   WHERE id_producto = ? AND stock >= ?`,
                  [item.cantidad, item.id_producto, item.cantidad],
                  (err, result) => {

                    if (err || result.affectedRows === 0) {
                      console.error("Error al descontar stock o stock insuficiente");
                      errorInsert = true;
                    }

                    insertCount++;

                    // ✅ Validar cuando terminan todos
                    if (insertCount === listaProductos.length) {

                      if (errorInsert) {
                        return db.query('ROLLBACK', () => res.status(500).json({ numeroDocumento: "" }));
                      }

                      db.query('COMMIT', (err) => {
                        if (err) {
                          console.error(err);
                          return db.query('ROLLBACK', () => res.status(500).json({ numeroDocumento: "" }));
                        }
                        res.json({ numeroDocumento });
                      });
                    }
                  }
                );
              }
            }
          );
        });
      }
    );
  });
});