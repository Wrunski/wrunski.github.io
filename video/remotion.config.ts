// Configuração do render (npx remotion render). O arquivo sai em H.264,
// yuv420p e BT.709, como o laço do site; o CRF 18 é o mesmo do
// gerar-video.sh de testes-apps-diversos/video.
import { Config } from '@remotion/cli/config';

Config.setEntryPoint('src/index.ts');
Config.setOverwriteOutput(true);
Config.setVideoImageFormat('jpeg');
Config.setJpegQuality(95);
Config.setCodec('h264');
Config.setCrf(18);
Config.setPixelFormat('yuv420p');
Config.setColorSpace('bt709');
Config.setX264Preset('slow');
