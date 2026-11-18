const height = Number(process.argv[2]);
const weight = Number(process.argv[3]);

function calculateBMI(height, weight){
    const bmi = weight / (height * height);
    return bmi
}

const bmi = calculateBMI(height, weight);

if (bmi < 18.5){
    console.log(`The person is Underweight`);
} else if (bmi < 25){
    console.log('The person is Healthy weight');
} else if (bmi < 30){
    console.log("Overweight");
} else {
    console.log("Obese");
}


// console.log(bmi)