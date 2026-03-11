import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import OpenAI from 'openai';
import { type ChatCompletionMessageParam } from 'openai/resources';

/**
 * Herramienta interna que formatea la información clínica de una enfermedad
 * encontrada en el vademécum en un mensaje claro y ordenado para el usuario.
 * Esta función se invoca mediante el mecanismo de tool calling de OpenAI.
 */
function formatDiseaseInfo(args: any) {
  const { diseaseName, medications, patientProfile } = args;
  const lines = [] as string[];
  lines.push(`Condición consultada: ${diseaseName}`);
  const medNames = medications.map((m: any) => m.name).join(', ');
  lines.push(`Medicamentos encontrados: ${medNames || 'No disponibles'}`);
  medications.forEach((m: any) => {
    lines.push(`\n**${m.name}**`);
    if (m.dosage) lines.push(`• Dosis: ${m.dosage}`);
    if (m.frequency) lines.push(`• Frecuencia: ${m.frequency}`);
    if (m.duration) lines.push(`• Duración: ${m.duration}`);
    if (m.route) lines.push(`• Vía de administración: ${m.route}`);
    if (m.contraindications) lines.push(`• Contraindicaciones: ${m.contraindications}`);
    if (m.interactions) lines.push(`• Interacciones: ${m.interactions}`);
    if (m.allergies) lines.push(`• Alergias relevantes: ${m.allergies}`);
    if (m.redFlags) lines.push(`• Señales de alarma: ${m.redFlags}`);
    if (m.observations) lines.push(`• Observaciones: ${m.observations}`);
  });
  // Advertencias generales
  lines.push(`\nAdvertencias importantes: No se automedique. Consulte a un profesional de la salud si los síntomas persisten.`);
  lines.push(`Cuándo no automedicarse: Si presenta signos de alarma, si está embarazada, en lactancia, es menor de edad o tiene comorbilidades, busque atención médica.`);
  lines.push(`Cuándo buscar atención médica: Fiebre alta persistente, dificultad respiratoria, dolor intenso o síntomas que empeoran.`);
  lines.push(`\nDisclaimer: Esta información proviene del vademécum cargado en el sistema y no reemplaza la consulta con un profesional de la salud.`);
  return lines.join('\n');
}

/**
 * Endpoint que coordina la consulta a la base de datos y la generación de la
 * respuesta por la IA. Recibe como entrada una condición y un perfil de
 * paciente, busca la enfermedad en la base y luego utiliza OpenAI con
 * función de tool calling para transformar los resultados en una respuesta
 * clara. Si no hay coincidencia, devuelve un mensaje prudente.
 */
export async function POST(req: NextRequest) {
  const { condition, patientProfile } = await req.json();
  if (!condition || typeof condition !== 'string') {
    return NextResponse.json({ error: 'Condición no válida' }, { status: 400 });
  }
  // Busca la enfermedad en la base
  const search = condition.trim().toLowerCase();
  const disease = await prisma.disease.findFirst({
    where: {
      OR: [
        { name: search },
        { synonyms: { has: search } },
      ],
      active: true,
    },
    include: {
      medications: {
        where: { active: true },
        include: { medication: true },
      },
    },
  });
  if (!disease) {
    return NextResponse.json({ answer: 'No encuentro esta condición en el vademécum cargado. Te recomiendo consultar a un profesional de salud.' });
  }
  // Estructura los datos para la IA
  const meds = disease.medications.map((dm) => ({
    name: dm.medication.name,
    dosage: dm.dosage,
    frequency: dm.frequency,
    duration: dm.duration,
    route: dm.route,
    contraindications: dm.contraindications,
    interactions: dm.interactions,
    allergies: dm.allergies,
    redFlags: dm.redFlags,
    observations: dm.observations,
  }));
  // Construye mensajes para el modelo. El modelo recibirá el prompt del sistema
  // y una petición del usuario, y devolverá un tool call.
  const messages: ChatCompletionMessageParam[] = [
    {
      role: 'system',
      content:
        'Eres un asistente médico que responde basado únicamente en la información proporcionada a través de una herramienta llamada formatDiseaseInfo. No inventes medicamentos ni dosis. Utiliza lenguaje claro en español neutro. Si no tienes información suficiente, responde con prudencia.',
    },
    {
      role: 'user',
      content: `Paciente consulta: ${condition}. Perfil: ${patientProfile || 'adulto general'}`,
    },
    {
      role: 'assistant',
      content: null,
      tool_calls: [
        {
          id: 'format-call',
          type: 'function',
          function: {
            name: 'formatDiseaseInfo',
            arguments: JSON.stringify({
              diseaseName: disease.name,
              medications: meds,
              patientProfile: patientProfile || 'adulto general',
            }),
          },
        },
      ],
    },
  ];
  // Define la herramienta para que el modelo pueda invocarla
  const tools = [
    {
      type: 'function',
      function: {
        name: 'formatDiseaseInfo',
        description:
          'Devuelve una recomendación segura basada en la información del vademécum recibida. Debe incluir condición consultada, medicamentos, dosis, advertencias y un disclaimer.',
        parameters: {
          type: 'object',
          properties: {
            diseaseName: { type: 'string' },
            medications: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  dosage: { type: 'string', nullable: true },
                  frequency: { type: 'string', nullable: true },
                  duration: { type: 'string', nullable: true },
                  route: { type: 'string', nullable: true },
                  contraindications: { type: 'string', nullable: true },
                  interactions: { type: 'string', nullable: true },
                  allergies: { type: 'string', nullable: true },
                  redFlags: { type: 'string', nullable: true },
                  observations: { type: 'string', nullable: true },
                },
                required: ['name'],
              },
            },
            patientProfile: { type: 'string' },
          },
          required: ['diseaseName', 'medications'],
        },
      },
    },
  ];
  // Inicializa OpenAI
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo-1106',
      messages,
      tools,
      tool_choice: 'auto',
    });
    const message = completion.choices[0].message;
    if (message.tool_calls && message.tool_calls.length > 0) {
      // Ejecuta nuestra herramienta con los argumentos que envía el modelo
      const call = message.tool_calls[0];
      const args = JSON.parse(call.function.arguments as string);
      const result = formatDiseaseInfo(args);
      return NextResponse.json({ answer: result });
    }
    // Si no hay tool call, responde con el contenido del asistente
    return NextResponse.json({ answer: message.content });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Error al generar la respuesta' }, { status: 500 });
  }
}