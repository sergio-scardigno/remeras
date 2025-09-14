import { Schema, model, models } from 'mongoose';

const productSchema = new Schema({
  player_name: { type: String },
  team_id: { type: Number },
  season_id: { type: Number },
  position: { type: String },
  age: { type: Number },
  nationality: { type: String },
  current_club: { type: String },
  folder_name: { type: String },
  stock: {
    type: Number,
    required: true,
    default: 0,
  },
  fechaCreacion: {
    type: Date,
    default: Date.now,
  },
}, {
  collection: 'remeras', // Especificamos el nombre de la colección aquí
  strict: false // Permitimos campos que no están en el esquema
});

export default models.Product || model('Product', productSchema);
