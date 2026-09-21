import { Spectrum } from "spectrum-ts";
import { imessage, terminal } from "spectrum-ts/providers";
const app = await Spectrum({
 projectId: process.env.SPECTRUM_PROJECT_ID,
 projectSecret: process.env.SPECTRUM_PROJECT_SECRET,
 providers: [
 imessage.config(),
 terminal.config(), // use this one first -- no phone/line needed to test
 ],
});
for await (const [space] of app.messages) {
 // TODO: swap in the shared handleIncoming(text, from) once extracted
 await space.send("How can I help?");
}