import tensorflow as tf
import tensorflowjs as tfjs
from tensorflow import keras

# Create training and test data from MNIST dataset
(train_img, train_label), (test_img, test_label) = keras.datasets.mnist.load_data()

# Reshape and scale data
train_img = train_img.reshape([-1, 28, 28, 1])
train_img = train_img / 255.0

test_img = test_img.reshape([-1, 28, 28, 1])
test_img = test_img/255.0

# CNN-model structure
model = keras.Sequential([
  keras.layers.Conv2D(32, (5, 5), padding="same", input_shape=[28, 28, 1]),
  keras.layers.MaxPool2D(2, 2),

  keras.layers.Conv2D(64, (5, 5), padding="same"),
  keras.layers.MaxPool2D(2, 2),

  keras.layers.Flatten(),
  keras.layers.Dense(1024, activation="relu"),
  keras.layers.Dropout(0.2),
  keras.layers.Dense(10, activation="softmax")
])

model.compile(
  optimizer="adam",
  loss="categorical_crossentropy",
  metrics=["accuracy"]
)

# Training the CNN model
model.fit(
  train_img, train_label,
  validation_data=(test_img, test_label),
  epochs=25
)

# Evaluate the accuracy
test_loss, test_acc = model.evaluate(test_img, test_label)
print("Test accuracy:", test_acc)

# Convert model into browser compatible format
tfjs.converters.save_keras_model(model, "models")