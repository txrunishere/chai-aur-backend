require("dotenv").config();
const connectDB = require("./db/index");

connectDB()
  .then(() => {
    app.listen(process.env.PORT || 8080, () => {
      console.log(`App is listing on PORT: ${process.env.PORT}`);
    });
  })
  .catch((err) => {
    console.log("MONGODB Connection failed!! ", err);
  });
