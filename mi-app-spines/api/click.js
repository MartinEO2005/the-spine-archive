export default function handler(req, res) {
  res.status(200).json({ message: "La función responde correctamente", author: req.query.author });
}