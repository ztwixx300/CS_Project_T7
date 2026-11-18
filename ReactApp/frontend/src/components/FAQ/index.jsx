
import { Accordion, AccordionSummary, AccordionDetails,Typography } from "@mui/material"
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

const faqs = [{
    question: 'What is AirAware?',
    answer: 'AirAware is air quality forecasting tool that utilzes machine learning to provide a estimated accurate result for a chosen day.'
},
{
    question: "How does the forecast work?",
    answer: "utilizing the data from sources such as Environmental Protection Agency, we run the data through XGBoost which then predicts the air quality levels for the particular day "
},
{
    question: 'Why should does this concern me?',
    answer: "Oxygen is essential to life on this planet however, there there harmful gases and small particulates that can cause health issues to those that breath it in."
},
{
    question: 'What are some examples of the harmful gasses?',
    answer: 'Our app specifically focuses on Ozone, Particulate Matter 10 and 2.5 (PM10, PM2.5), Carbon Monoxide(CO), Nitrogen Dioxide(NO2)'
},
{
    question: "Why is Particulate Matter 10 and 2.5 bad?",
    answer: "Main contributer of this is motor vehicles, power plants, forest fires, and industrial processe. Breathing in PM10 or PM2.5 effects the health of the individual in as little as an hour and even years",
},
{
    question: "Why is Carbon Monoxide bad?",
    answer: "This is a odorless, colorless gas its main contributer being motor vehicles. Breathing this reduces the overall amount of oxygen the person is receiving in their body which makes it difficult to do day to day tasks."
},
{
    question:"why is Ozone bad?",
    answer: "Ozone is gas found in the air we breathe, there is good and bad ozone. The bad ozone is the ground level ozone which causes a myriad of adverse health affects that reduces the lungs ability to function well"
},

]
function FAQ() {
    return(
    <div className="faq">
        <h1 className="splash-title">Frequently Asked Questions</h1>
        {faqs.map((item,i) => (
            <Accordion key ={item.question} sx={{maxWidth: 800, width:'100%'}}> 
                <AccordionSummary expandIcon={<ExpandMoreIcon />}
                    aria-controls={`faq-panel-${i}-content`}
                    id={`faq-panel1-${i}-header`}>
                    <Typography sx={{ fontWeight: 600}}>
                        {item.question}
                    </Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <Typography>{item.answer}</Typography>
                </AccordionDetails>
            </Accordion>
        ))}

    </div>
    )
}

export default FAQ