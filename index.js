require ('dotenv').config();

const googleApplicationCredentials = process.env.GOOGLE_APPLICATION_CREDENTIALS;
console.log("Caminho das credenciais:", googleApplicationCredentials); 

const express = require('express');
const cors = require('cors');
const { VertexAI } = require('@google-cloud/vertexai');

const app = express();
const port = 8080;

app.use(express.json({limit: '50mb'}));
app.use(express.static('frontend/dist'));
app.use(cors());

// Inicialize o Vertex com o projeto e localização do Cloud
const vertex_ai = new VertexAI({ project: 'vertex-ai-gemini-423913', location: 'us-central1' });
const model = 'gemini-1.5-pro-preview-0514';

// Instancie o modelo
const generativeModel = vertex_ai.preview.getGenerativeModel({
    model: model,
    generationConfig: {
      'maxOutputTokens': 8192,
      'temperature': 1,
      'topP': 0.95,
    },
    safetySettings: [
      {
        'category': 'HARM_CATEGORY_HATE_SPEECH',
        'threshold': 'BLOCK_ONLY_HIGH',
      },
      {
        'category': 'HARM_CATEGORY_DANGEROUS_CONTENT',
        'threshold': 'BLOCK_LOW_AND_ABOVE',
      },
      {
        'category': 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
        'threshold': 'BLOCK_LOW_AND_ABOVE',
      },
      {
        'category': 'HARM_CATEGORY_HARASSMENT',
        'threshold': 'BLOCK_LOW_AND_ABOVE',
      }
    ],
    systemInstruction: {
      parts: [
        { text: 'Você é um Ajudante i9 Educação. Seu nome é Ivone. Seja bem-vindo à i9 Educação!Somos uma empresa apaixonada por educação de alta qualidade e acreditamos que o conhecimento tem o poder de transformar vidas. Você só pode responder informações referente a I9 educação, caso não seja sobre a i9, responda: Não possuo esta informação. Formate suas respostas utilizando markdown. ' }
      ]
    },
  });

  app.get('/', (req, res) => {
    res.send('Olá, mundo!');
  });

  app.post('/api/generate', async (req, res) => {
    const apiUrl = process.env.API_URL;
    // Receba a mensagem do usuário
    const userMessage = req.body.message;
    const fileData = req.body.file; 
    let messageContent = [{ text: userMessage }];
  
    if (fileData) {
      const fileContent = {
        inlineData: {
          mimeType: fileData.mimeType,
          data: fileData.data
        }
      };
      messageContent.push(fileContent); 
    }
    try{
      const generatedText = await generateTextFromUserMessage(messageContent);
    res.json({ response: generatedText });
  } catch (error) {
    console.error("Erro ao processar mensagem:", error);
    res.status(500).send("Erro ao processar mensagem");
    }
  });

  async function generateTextFromUserMessage(messageContent) {
    const req = {
      contents: [
        { role: 'user', parts: messageContent }
      ],
    };
    try {
      const streamingResp = await generativeModel.generateContentStream(req);
      let generatedText = '';
  
      for await (const item of streamingResp.stream) {
        if (item.candidates && item.candidates[0].content && item.candidates[0].content.parts) {
          for (const part of item.candidates[0].content.parts) {
            if (part.text) {
              generatedText += part.text;
            }
          }
        }
      }
  
    return generatedText;
  } catch(error){
    console.error("Erro ao gerar texto:", error);
    throw error; 
  }
}

  // Inicie o servidor Express
app.listen(port, () => {
    console.log(`Servidor rodando na porta ${port}`);
  });


 /* const image1 = {
    inlineData: {
      mimeType: 'TIPO DO ARQUIVO',
      data: `BASE64 DO ARQUIVO`
    }
  };


    const req = {
      contents: [
        {role: 'user', parts: [text1, image1]}
      ],
    };*/