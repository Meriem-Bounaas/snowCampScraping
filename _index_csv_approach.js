import puppeteer from "puppeteer";
import { createObjectCsvWriter } from 'csv-writer'

 
const csvWriter = createObjectCsvWriter({
    path: 'results.csv',
    header: [
      
        {id: 'title', title: 'title'},
        {id: 'date', title: 'date'},
        {id: 'description', title: 'description'},
        {id: 'adress', title: 'adress'},
        {id: 'type', title: 'type'},
        {id: 'customFields', title: 'custom'},
        {id: 'Attendes', title: 'Attendes'},
        {id: 'speakersNames', title: 'speakers'},
    ]
});


const getEvents = async () => {

    

    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: null,
      });

    const page = await browser.newPage();

    await page.goto("https://snowcamp2023.sched.com/", {
        waitUntil: "domcontentloaded",
    });

    const eventsLinks =   await page.evaluate(() => { 
        const isValidUrl = (url) => {
            try {
              new URL(url);
              return true;
            } catch (error) {
              return false;
            }
          }
        const allevents = document.querySelectorAll(".event");
        const tableResult = []
        for (let index = 0; index < allevents.length; index++) {
            
            const element = allevents[index];
            
            const link = element.querySelector('a').getAttribute('href')
           
            tableResult.push(isValidUrl(link)? link : `https://snowcamp2023.sched.com/${link}`,)
        }

        return tableResult

    })

    // traitement des liens un par un 

    // for (let index = 0; index < 5; index++) {
    
    const events = []
    for (let index = 0; index < eventsLinks.length; index++) {
        const link = eventsLinks[index];
        
        console.log(link) 
        const p = await browser.newPage();

        await p.goto(link, {
            waitUntil: "domcontentloaded",
        });

        
         const event =  await  p.evaluate(() => {
            const title = document.querySelector('.event a').innerText;
            const date = document.querySelector('.sched-container-dates').innerText
            // innerHTML ou InnerText Selon le besoin ?!!
            const description = document.querySelector('.tip-description') ? document.querySelector('.tip-description').innerHTML : ''
            const adressElement = document.querySelector('.sched-event-details-timeandplace')
            const adress = `${adressElement.querySelector('a').innerText} ${adressElement.querySelector('em').innerText}`

            const speakersList = document.querySelectorAll('.sched-person-session');
            const speakersNames = []
            for (let index = 0; index < speakersList.length; index++) {
                const element = speakersList[index];
                speakersNames.push(element.querySelector('h2 > a').innerText)
            }
          

            const type = Array.from(document.querySelector('.sched-event-type').querySelectorAll('div > a')).map(x=>x.innerText.trim()).join(", ")
            const customFieldsElements = document.querySelector('.tip-custom-fields').querySelector('li')  
            const customFields = customFieldsElements ? customFieldsElements.textContent.trim() : '';

            const AttendesList = document.querySelectorAll('#sched-page-event-attendees li')

            return {
                title,
                date,
                description,
                adress,
                type,
                customFields,
                AttendesList: AttendesList.length,
                speakersNames: speakersNames.join(" , ")
            }
         
         })

        events.push(event)

        await p.close();
    }



    console.log(events)

    const records =  events.map(evt => {
        return {
         
            title: evt.title,
            date: evt.date,
            description: evt.description,
            adress: evt.adress,
            type: evt.type,
            customFields: evt.customFields,
            Attendes: evt.Attendes,
            speakersNames: evt.speakersNames,
        }
    })
    
    
    csvWriter.writeRecords(records)      
    .then(() => {
        console.log('...Done Writing');
    });
 
   await browser.close();

}


getEvents()