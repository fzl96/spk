import { alternatif } from "@/config/topsis";

interface Evaluation {
  criteriaId: string;
  criteriaName: string;
  criteriaWeight: number;
  criteriaCode: string;
  criteriaType: string;
  nilai: number;
}

interface Alternative {
  id: string;
  name: string;
  evaluation: Evaluation[];
}

interface Result {
  alternative: Alternative;
  closenessScore: number;
}

interface NormalizationFactor {
  code: string;
  normalizationFactor: number;
}

interface WeightedMatrix {
  id: string;
  name: string;
  weightedMatrix: {
    criteriaId: string;
      criteriaCode: string;
      criteriaName: string;
      criteriaType: string;
      weightedValue: number;
  }[];
}

interface IdealValue {
  criteriaCode: string;
  criteriaName: string;
  idealValue: number;
}


export function calculateNormalizationFactor(data: Alternative[]): NormalizationFactor[] {
  const normalizationFactors: NormalizationFactor[] = [];

  const groupedEvaluations: { [criteriaCode: string]: number[] } = {};

  for (const alternative of data) {
    for (const evaluation of alternative.evaluation) {
      const { criteriaCode, nilai } = evaluation;
      if (!groupedEvaluations[criteriaCode]) {
        groupedEvaluations[criteriaCode] = [];
      }
      groupedEvaluations[criteriaCode].push(Math.abs(nilai));
    }
  }

  for (const criteriaCode in groupedEvaluations) {
    const evaluations = groupedEvaluations[criteriaCode];
    const sum = evaluations.reduce((acc, val) => acc + Math.pow(val, 2), 0);
    const normalizationFactor = Math.sqrt(sum);

    normalizationFactors.push({
      code: criteriaCode,
      normalizationFactor: normalizationFactor,
    });
  }

  return normalizationFactors;
}

export function divideByNormalizationFactor(data: Alternative[], normalizationFactors: NormalizationFactor[]): Alternative[] {
  const normalizedData: Alternative[] = [];

  const groupedNormalizationFactors: { [criteriaCode: string]: number } = {};
  normalizationFactors.forEach((factor) => {
    groupedNormalizationFactors[factor.code] = factor.normalizationFactor;
  });

  for (const alternative of data) {
    const normalizedEvaluation: Evaluation[] = [];
    for (const evaluation of alternative.evaluation) {
      const { criteriaCode, nilai } = evaluation;
      const normalizationFactor = groupedNormalizationFactors[criteriaCode];
      const normalizedValue = nilai / normalizationFactor;

      const normalizedCriteria: Evaluation = {
        criteriaId: evaluation.criteriaId,
        criteriaName: evaluation.criteriaName,
        criteriaWeight: evaluation.criteriaWeight,
        criteriaCode: evaluation.criteriaCode,
        criteriaType: evaluation.criteriaType,
        nilai: normalizedValue,
      };

      normalizedEvaluation.push(normalizedCriteria);
    }

    const normalizedAlternative: Alternative = {
      id: alternative.id,
      name: alternative.name,
      evaluation: normalizedEvaluation,
    };

    normalizedData.push(normalizedAlternative);
  }

  return normalizedData;
}


export function getCriteriaWeights(data: Alternative[]) {
  const criteriaWeights = data[0].evaluation.map((evaluation) => ({
    criteriaWeight: evaluation.criteriaWeight,
    criteriaCode: evaluation.criteriaCode,
    criteriaName: evaluation.criteriaName,
  }));
  return criteriaWeights;
}

export function getWeightedMatrix(normalizedData: Alternative[], criteriaWeights: { criteriaWeight: number, criteriaCode: string }[]): WeightedMatrix[] {
  const weightedMatrix: WeightedMatrix[] = [];

  for (const alternative of normalizedData) {
    const weightedRow: WeightedMatrix['weightedMatrix'] = alternative.evaluation.map((evaluation) => {
      const weightObj = criteriaWeights.find((weight) => weight.criteriaCode === evaluation.criteriaCode);
      const weight = weightObj ? weightObj.criteriaWeight : 0;
      const weightedValue = evaluation.nilai * weight;

      return {
        criteriaId: evaluation.criteriaId,
        criteriaCode: evaluation.criteriaCode,
        criteriaName: evaluation.criteriaName,
        weightedValue: weightedValue,
        criteriaType: evaluation.criteriaType,
      };
    });

    weightedMatrix.push({
      id: alternative.id,
      name: alternative.name,
      weightedMatrix: weightedRow,
    });
  }

  return weightedMatrix;
}

export function getPositiveIdealSolution(weightedMatrix: WeightedMatrix[]): IdealValue[] {
  const positiveIdealSolution: IdealValue[] = [];

  // Iterate through each criteria
  for (const criteria of weightedMatrix[0].weightedMatrix) {
    // Initialize the ideal value based on the criteria type
    let idealValue: number;
    if (criteria.criteriaType.toLowerCase() === 'benefit') {
      // For "Benefit" criteria, initialize with the lowest possible value
      idealValue = Number.NEGATIVE_INFINITY;
    } else {
      // For "Cost" criteria, initialize with the highest possible value
      idealValue = Number.POSITIVE_INFINITY;
    }

    // Iterate through each alternative
    for (const alternative of weightedMatrix) {
      // Get the weighted value for the current criteria and alternative
      const weightedValue = alternative.weightedMatrix.find((c) => c.criteriaCode === criteria.criteriaCode)?.weightedValue || 0;

      // Update the ideal value based on the criteria type
      if (criteria.criteriaType.toLowerCase() === 'benefit') {
        // For "Benefit" criteria, update if a greater value is found
        if (weightedValue > idealValue) {
          idealValue = weightedValue;
        }
      } else {
        // For "Cost" criteria, update if a smaller value is found
        if (weightedValue < idealValue) {
          idealValue = weightedValue;
        }
      }
    }

    // Add the criteria and its positive ideal value to the result array
    positiveIdealSolution.push({
      criteriaCode: criteria.criteriaCode,
      criteriaName: criteria.criteriaName,
      idealValue: idealValue,
    });
  }

  return positiveIdealSolution;
}

export function getNegativeIdealSolution(weightedMatrix: WeightedMatrix[]): IdealValue[] {
  const negativeIdealSolution: IdealValue[] = [];

  // Iterate through each criteria
  for (const criteria of weightedMatrix[0].weightedMatrix) {
    // Initialize the ideal value based on the criteria type
    let idealValue: number;
    if (criteria.criteriaType.toLowerCase() === 'cost') {
      // For "Benefit" criteria, initialize with the lowest possible value
      idealValue = Number.NEGATIVE_INFINITY;
    } else {
      // For "Cost" criteria, initialize with the highest possible value
      idealValue = Number.POSITIVE_INFINITY;
    }

    // Iterate through each alternative
    for (const alternative of weightedMatrix) {
      // Get the weighted value for the current criteria and alternative
      const weightedValue = alternative.weightedMatrix.find((c) => c.criteriaCode === criteria.criteriaCode)?.weightedValue || 0;

      // Update the ideal value based on the criteria type
      if (criteria.criteriaType.toLowerCase() === 'cost') {
        // For "Benefit" criteria, update if a greater value is found
        if (weightedValue > idealValue) {
          idealValue = weightedValue;
        }
      } else {
        // For "Cost" criteria, update if a smaller value is found
        if (weightedValue < idealValue) {
          idealValue = weightedValue;
        }
      }
    }

    // Add the criteria and its positive ideal value to the result array
    negativeIdealSolution.push({
      criteriaCode: criteria.criteriaCode,
      criteriaName: criteria.criteriaName,
      idealValue: idealValue,
    });
  }

  return negativeIdealSolution;
}

type DistanceObject = {
  id: string;
  name: string;
  distance: number;
}

export function calculatePositiveDistance(weightedMatrix: WeightedMatrix[], positiveIdealSolution: IdealValue[]){
  const distances: number[] = [];
  const distancesObject: DistanceObject[] = []

  for (const alternative of weightedMatrix) {
    let distanceSquared = 0;

    for (const criteria of alternative.weightedMatrix) {
      const deviation = criteria.weightedValue - positiveIdealSolution.find((item) => item.criteriaCode === criteria.criteriaCode)?.idealValue!;
      distanceSquared += deviation ** 2;
    }

    const distance = Math.sqrt(distanceSquared);
    distances.push(distance);
    distancesObject.push({
      id: alternative.id,
      name: alternative.name,
      distance: roundNumber(distance)
    })
  }

  return {
    distances,
    distancesObject
  };
}

export function calculateNegativeDistance(weightedMatrix: WeightedMatrix[], negativeIdealSolution: IdealValue[]){
  const distances: number[] = [];
  const distancesObject: DistanceObject[] = []

  for (const alternative of weightedMatrix) {
    let distanceSquared = 0;

    for (const criteria of alternative.weightedMatrix) {
      const deviation = criteria.weightedValue - negativeIdealSolution.find((item) => item.criteriaCode === criteria.criteriaCode)?.idealValue!;
      distanceSquared += deviation ** 2;
    }

    const distance = Math.sqrt(distanceSquared);
    distances.push(distance);
    distancesObject.push({
      id: alternative.id,
      name: alternative.name,
      distance: roundNumber(distance)
    })
  }

  return {
    distances,
    distancesObject
  };
}

type PreferenceObject = {
  id: string;
  name: string;
  preferenceValues: number;
};

export function calculatePreferenceValues(
  positiveDistances: DistanceObject[],
  negativeDistances: DistanceObject[]
): PreferenceObject[] {
  const preferenceValues: PreferenceObject[] = [];

  for (let i = 0; i < positiveDistances.length; i++) {
    const positiveDistance = positiveDistances[i].distance;
    const negativeDistance = negativeDistances[i].distance;
    const preferenceValue = negativeDistance / (positiveDistance + negativeDistance);
    const preferenceObject: PreferenceObject = {
      id: positiveDistances[i].id,
      name: positiveDistances[i].name,
      preferenceValues: preferenceValue,
    };
    preferenceValues.push(preferenceObject);
  }

  return preferenceValues;
}


export function roundNumber(num: number): number {
  const roundedNum = Math.round(num * 1e9) / 1e9;
  return roundedNum;
}

export function getTopsis(data: Alternative[]) {
  if (data.length === 0 || !data) {
    return null;
  }
  
  const normalizationFactors: NormalizationFactor[] = calculateNormalizationFactor(data);

  // Matrix R
  const normalizedData: Alternative[] = divideByNormalizationFactor(data, normalizationFactors);
  
  const criteriaWeights = getCriteriaWeights(normalizedData);
  
  // Matrix Y
  const weightedMatrix: WeightedMatrix[] = getWeightedMatrix(normalizedData, criteriaWeights);

  // A+
  const positiveIdeal = getPositiveIdealSolution(weightedMatrix);

  // A-
  const negativeIdeal = getNegativeIdealSolution(weightedMatrix);


  const positiveDistances = calculatePositiveDistance(weightedMatrix, positiveIdeal);
  const negativeDistances = calculateNegativeDistance(weightedMatrix, negativeIdeal);
  const preferenceValuesSolution = calculatePreferenceValues(positiveDistances.distancesObject, negativeDistances.distancesObject);

  // let total = 0;
  // const nums = [73, 69, 71, 71]  

  // return normalizationFactors;
  const positiveIdealSolution = positiveIdeal.map((data) => ({
    id: data.criteriaCode,
    name: data.criteriaName,
    idealValue: data.idealValue,
  }));

  const negativeIdealSolution = negativeIdeal.map((data) => ({
    id: data.criteriaCode,
    name: data.criteriaName,
    idealValue: data.idealValue,
  }));

  const positiveDistancesSolution = positiveDistances.distances.map((data, index) => ({
    id: `D${index + 1}+`,
    value: roundNumber(data),
  }))

  const negativeDistancesSolution = negativeDistances.distances.map((data, index) => ({
    id: `D${index + 1}-`,
    value: roundNumber(data),
  }))

  // sort preference values by highest value first (descending) and add rank
  const preferenceValues = preferenceValuesSolution.sort((a, b) => b.preferenceValues - a.preferenceValues).map((data, index) => ({
    id: data.id,
    name: data.name,
    preferenceValues: roundNumber(data.preferenceValues),
    rank: index + 1,
  }))

  return {
    normalizedData,
    criteriaWeights,
    weightedMatrix,
    positiveIdealSolution,
    negativeIdealSolution,
    positiveDistancesSolution,
    negativeDistancesSolution,
    preferenceValues,
  }
}
