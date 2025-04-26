import * as tf from '@tensorflow/tfjs';

export async function createPotholeDetectionModel() {
  const model = tf.sequential();

  // Input layer for 224x224 RGB images
  model.add(tf.layers.conv2d({
    inputShape: [224, 224, 3],
    filters: 32,
    kernelSize: 3,
    activation: 'relu',
  }));
  model.add(tf.layers.maxPooling2d({ poolSize: 2 }));

  model.add(tf.layers.conv2d({
    filters: 64,
    kernelSize: 3,
    activation: 'relu',
  }));
  model.add(tf.layers.maxPooling2d({ poolSize: 2 }));

  model.add(tf.layers.conv2d({
    filters: 64,
    kernelSize: 3,
    activation: 'relu',
  }));

  model.add(tf.layers.flatten());
  model.add(tf.layers.dense({ units: 64, activation: 'relu' }));
  model.add(tf.layers.dense({ units: 1, activation: 'sigmoid' }));

  model.compile({
    optimizer: tf.train.adam(0.001),
    loss: 'binaryCrossentropy',
    metrics: ['accuracy'],
  });

  return model;
}

export async function preprocessImage(imageElement: HTMLImageElement): Promise<tf.Tensor4D> {
  return tf.tidy(() => {
    const tensor = tf.browser.fromPixels(imageElement)
      .resizeNearestNeighbor([224, 224])
      .toFloat()
      .div(255.0)
      .expandDims();
    return tensor as tf.Tensor4D;
  });
}

export async function detectPothole(model: tf.LayersModel, imageElement: HTMLImageElement): Promise<boolean> {
  const tensor = await preprocessImage(imageElement);
  const prediction = await model.predict(tensor) as tf.Tensor;
  const probability = await prediction.data();
  tf.dispose([tensor, prediction]);
  return probability[0] > 0.5;
}