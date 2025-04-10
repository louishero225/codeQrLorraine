import { useState, useRef, useEffect } from "react";
import QRCode from "react-qr-code";
import JsBarcode from "jsbarcode";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const EtiquetteGenerator = () => {
  const [etiquettes, setEtiquettes] = useState([]);
  const [form, setForm] = useState({
    nom: "",
    couleur: "",
    imei1: "",
    imei2: "",
    serial: "",
    label: "A",
  });

  // État pour les erreurs de validation
  const [errors, setErrors] = useState({
    imei1: "",
    imei2: "",
  });

  // Références pour les codes-barres et les étiquettes pour l'export PDF
  const barcode1Refs = useRef([]);
  const barcode2Refs = useRef([]);
  const etiquetteRefs = useRef([]);

  // Effet pour générer les codes-barres après le rendu
  useEffect(() => {
    barcode1Refs.current = barcode1Refs.current.slice(0, etiquettes.length);
    barcode2Refs.current = barcode2Refs.current.slice(0, etiquettes.length);
    etiquetteRefs.current = etiquetteRefs.current.slice(0, etiquettes.length);

    etiquettes.forEach((etiquette, index) => {
      if (barcode1Refs.current[index] && etiquette.imei1) {
        JsBarcode(barcode1Refs.current[index], etiquette.imei1, {
          format: "CODE128",
          width: 2.5,
          height: 40,
          displayValue: false,
        });
      }

      if (barcode2Refs.current[index] && etiquette.imei2) {
        JsBarcode(barcode2Refs.current[index], etiquette.imei2, {
          format: "CODE128",
          width: 2.5,
          height: 40,
          displayValue: false,
        });
      }
    });
  }, [etiquettes]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });

    // Validation pour les IMEI
    if (name === "imei1" || name === "imei2") {
      // Vérifier si la valeur contient uniquement des chiffres
      const isNumeric = /^\d*$/.test(value);

      if (!isNumeric && value !== "") {
        setErrors((prev) => ({
          ...prev,
          [name]: "L'IMEI doit contenir uniquement des chiffres",
        }));
      } else if (value.length > 0 && value.length !== 15) {
        setErrors((prev) => ({
          ...prev,
          [name]: "L'IMEI doit contenir exactement 15 chiffres",
        }));
      } else {
        setErrors((prev) => ({ ...prev, [name]: "" }));
      }
    }
  };

  const addEtiquette = () => {
    // Vérifier si les IMEI sont valides (non vides et exactement 15 chiffres)
    const imei1Valid = form.imei1.length === 15 && /^\d{15}$/.test(form.imei1);
    const imei2Valid = form.imei2.length === 15 && /^\d{15}$/.test(form.imei2);

    if (!imei1Valid) {
      setErrors((prev) => ({
        ...prev,
        imei1: "L'IMEI 1 doit contenir exactement 15 chiffres",
      }));
    }

    if (!imei2Valid) {
      setErrors((prev) => ({
        ...prev,
        imei2: "L'IMEI 2 doit contenir exactement 15 chiffres",
      }));
    }

    // Ne pas ajouter l'étiquette si les IMEI ne sont pas valides
    if (!imei1Valid || !imei2Valid) return;

    setEtiquettes([...etiquettes, form]);
    setForm({
      nom: "",
      couleur: "",
      imei1: "",
      imei2: "",
      serial: "",
      label: form.label, // Conserver la même lettre pour faciliter la création d'étiquettes en série
    });

    // Réinitialiser les erreurs
    setErrors({
      imei1: "",
      imei2: "",
    });
  };

  // Fonction pour supprimer une étiquette
  const removeEtiquette = (index) => {
    const newEtiquettes = [...etiquettes];
    newEtiquettes.splice(index, 1);
    setEtiquettes(newEtiquettes);
  };

  const generatePDF = async () => {
    if (etiquettes.length === 0) return;

    // Création d'une barre de progression visuelle pour l'utilisateur
    const progressDiv = document.createElement("div");
    progressDiv.style.position = "fixed";
    progressDiv.style.top = "10px";
    progressDiv.style.left = "50%";
    progressDiv.style.transform = "translateX(-50%)";
    progressDiv.style.backgroundColor = "rgba(0,0,0,0.7)";
    progressDiv.style.color = "white";
    progressDiv.style.padding = "10px 20px";
    progressDiv.style.borderRadius = "5px";
    progressDiv.style.zIndex = "9999";
    progressDiv.textContent = "Préparation du PDF...";
    document.body.appendChild(progressDiv);

    try {
      // Création d'un document PDF en format A4 portrait pour mieux accueillir plusieurs étiquettes
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      // Fond blanc pour le document entier
      doc.setFillColor(255, 255, 255);
      doc.rect(
        0,
        0,
        doc.internal.pageSize.getWidth(),
        doc.internal.pageSize.getHeight(),
        "F"
      );

      // Dimensions et positionnement
      const marginLeft = 10; // 1 cm de marge à gauche
      const marginTop = 10; // 1 cm de marge en haut
      const spacing = 5; // 0.5 cm d'espacement entre les étiquettes
      const etiquetteWidth = 45; // 4.5 cm de largeur
      const etiquetteHeight = 25; // 2.5 cm de hauteur

      let currentY = marginTop; // Position Y initiale

      // Pour chaque étiquette, convertir l'élément HTML en canvas puis en image pour le PDF
      for (let i = 0; i < etiquettes.length; i++) {
        const etiquette = etiquettes[i];
        const etiquetteElement = etiquetteRefs.current[i];

        if (!etiquetteElement) continue;

        progressDiv.textContent = `Traitement de l'étiquette ${i + 1}/${
          etiquettes.length
        }...`;

        // Attendre un peu pour s'assurer que les codes-barres sont bien rendus
        await new Promise((resolve) => setTimeout(resolve, 200));

        // Convertir l'élément HTML en canvas
        const canvas = await html2canvas(etiquetteElement, {
          scale: 2, // Meilleure qualité
          useCORS: true,
          allowTaint: true,
          backgroundColor: "white",
        });

        // Conversion du canvas en image base64
        const imgData = canvas.toDataURL("image/png");

        // Vérifier si l'étiquette peut tenir sur la page actuelle
        if (
          currentY + etiquetteHeight >
          doc.internal.pageSize.getHeight() - marginTop
        ) {
          // Ajouter une nouvelle page si l'étiquette ne tient pas
          doc.addPage();
          currentY = marginTop;
        }

        // Ajout de l'image au PDF
        doc.addImage(
          imgData,
          "PNG",
          marginLeft,
          currentY,
          etiquetteWidth,
          etiquetteHeight
        );

        // Mise à jour de la position Y pour la prochaine étiquette
        currentY += etiquetteHeight + spacing;
      }

      // Téléchargement du PDF
      doc.save("etiquettes.pdf");

      progressDiv.textContent = "PDF généré avec succès!";
      setTimeout(() => {
        document.body.removeChild(progressDiv);
      }, 2000);
    } catch (error) {
      console.error("Erreur lors de la génération du PDF:", error);
      progressDiv.textContent = "Erreur lors de la génération du PDF";
      progressDiv.style.backgroundColor = "rgba(255,0,0,0.7)";
      setTimeout(() => {
        document.body.removeChild(progressDiv);
      }, 3000);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto pb-16">
      <h1 className="text-2xl font-bold mb-4">Générateur d'étiquettes</h1>

      {/* Formulaire */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <input
          type="text"
          name="nom"
          placeholder="Modèle (ex: X6880)"
          value={form.nom}
          onChange={handleChange}
          className="border p-2 rounded"
        />
        <input
          type="text"
          name="couleur"
          placeholder="Couleur (ex: SLEEK BLACK)"
          value={form.couleur}
          onChange={handleChange}
          className="border p-2 rounded"
        />
        <input
          type="text"
          name="imei1"
          placeholder="IMEI 1"
          value={form.imei1}
          onChange={handleChange}
          className={`border p-2 rounded ${
            errors.imei1 ? "border-red-500" : ""
          }`}
        />
        <input
          type="text"
          name="imei2"
          placeholder="IMEI 2"
          value={form.imei2}
          onChange={handleChange}
          className={`border p-2 rounded ${
            errors.imei2 ? "border-red-500" : ""
          }`}
        />
        <input
          type="text"
          name="serial"
          placeholder="Numéro de série (D/N)"
          value={form.serial}
          onChange={handleChange}
          className="border p-2 rounded"
        />
        <input
          type="text"
          name="label"
          placeholder="Lettre"
          value={form.label}
          onChange={handleChange}
          className="border p-2 rounded"
        />
      </div>

      {errors.imei1 && (
        <div className="text-red-500 text-sm mb-2">{errors.imei1}</div>
      )}
      {errors.imei2 && (
        <div className="text-red-500 text-sm mb-2">{errors.imei2}</div>
      )}

      <div className="flex flex-wrap gap-2 items-center">
        <button
          onClick={addEtiquette}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
        >
          Ajouter une étiquette
        </button>
        <button
          onClick={generatePDF}
          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
          disabled={etiquettes.length === 0}
        >
          Exporter en PDF
        </button>

        {/* Compteur d'étiquettes */}
        <div className="ml-4 px-3 py-1 bg-gray-100 rounded-lg font-medium">
          {etiquettes.length}{" "}
          {etiquettes.length <= 1 ? "étiquette" : "étiquettes"}
        </div>
      </div>

      {/* Prévisualisation des étiquettes */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {etiquettes.map((etiquette, index) => (
          <div key={index} className="relative">
            {/* Conteneur de l'étiquette avec ref pour le PDF */}
            <div
              ref={(el) => (etiquetteRefs.current[index] = el)}
              className="border-2 border-black px-2 py-1 w-full mx-auto"
              style={{
                aspectRatio: "9/5",
                borderColor: "#000000",
                maxWidth: "225px", // 4.5cm équivalent en pixels pour l'écran (1cm ≈ 50px)
              }}
            >
              <div className="flex justify-between">
                {/* Colonne de gauche: Codes-barres et texte */}
                <div className="w-full md:w-3/5 flex-1">
                  {/* En-tête: Modèle et Couleur */}
                  <div className="flex justify-between mb-1">
                    <div className="font-bold  flex items-center justify-between w-full">
                      <div className="text-[8px]">{etiquette.nom}</div>
                      <div className="text-[8px] pr-5 whitespace-nowrap">{etiquette.couleur}</div>
                    </div>
                  </div>
                  {/* Premier code-barres et IMEI */}
                  <div className="flex flex-col items-start gap-0">
                    <svg
                      ref={(el) => {
                        if (el) barcode1Refs.current[index] = el;
                      }}
                      className="w-auto h-5 -ml-0.5 "
                    ></svg>
                    <div className="text-[10px] -mt-1">
                      Imei: {etiquette.imei1}
                    </div>
                  </div>

                  {/* Deuxième code-barres et IMEI */}
                  <div className="flex flex-col items-start gap-0">
                    <svg
                      ref={(el) => {
                        if (el) barcode2Refs.current[index] = el;
                      }}
                      className="w-auto h-5 -ml-0.5   mt-1"
                    ></svg>
                    <div className="text-[10px] -mt-1">
                      Imei: {etiquette.imei2}
                    </div>
                  </div>

                  {/* Numéro de série */}
                  <div className="text-[8px] font-bold ">
                    D/N:{etiquette.serial || "N/A"}
                  </div>
                </div>

                {/* Colonne de droite: Code QR et logo */}
                <div className="py-0 flex flex-col items-center gap-1 mt-3 pl-2">
                  <QRCode
                    value={etiquette.imei1}
                    size={60}
                    className="w-12 h-12 mb-0"
                  />

                  {/* Logo circulaire avec le label */}
                  <div
                    className="border-2 border-black rounded-full px-1 py-0 text-center font-bold h-8 w-8"
                    style={{ borderColor: "#000000" }}
                  >
                    <div className="text-lg font-bold mt-[-7px]">
                      {etiquette.label}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bouton de suppression en dehors du cadre de l'étiquette */}
            <div className="flex justify-end mt-2">
              <button
                onClick={() => removeEtiquette(index)}
                className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
              >
                Supprimer
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="fixed bottom-0 left-0 w-full py-4 text-center text-gray-600 bg-white border-t border-gray-200">
        <p className="text-sm">
          Conçu avec soin par KOFFI GUILLAUME - 0708997069
        </p>
      </div>
    </div>
  );
};

export default EtiquetteGenerator;
