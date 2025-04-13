#Packages
library(olsrr) #maybe need 
library(dplyr)
library(naniar)
library(ggplot2)
library(caret)
library(Metrics)
library(tidyverse)
library(plotly)


#Load the test dataset
housePrice = read.csv("https://raw.githubusercontent.com/tblakearmstrong/SMU-MSDS/refs/heads/main/Stats%206371/Final%20Project/train.csv", header = TRUE)
housePrice

testData = read.csv("https://raw.githubusercontent.com/tblakearmstrong/SMU-MSDS/refs/heads/main/Stats%206371/Final%20Project/test.csv", header = TRUE)
testData

gg_miss_var(housePrice)

###----------------------------------------- ANALYSIS 1 ---------------------------------------------------------------------------###
#Take out outliers after confirming they are outliers
housePrice1 = housePrice %>%
  filter(Neighborhood %in% c('NAmes','BrkSide','Edwards')
  ,GrLivArea < 3500)
housePrice1

#Linear assumption plot
ggplot(data = housePrice1, aes(x=GrLivArea, y= SalePrice, color = Neighborhood))+geom_point()+ggtitle("Sales Price vs. Living Area (SqFt) by Neighborhood")+xlab("Living Area (SqFt)") + ylab("Sales Price ($)")

#Separate with interaction terms
fit1_interaction = lm(SalePrice ~ GrLivArea*Neighborhood, data = housePrice1)
summary(fit1_interaction)
AIC(fit1_interaction)
confint(fit1_interaction)


#Generate diagnostic plots
par(mfrow = c(2, 2))  
#Residuals
plot(fit1_interaction, which = 1)
#Q-Q plot
plot(fit1_interaction, which = 2)
#Scale-Location plot
plot(fit1_interaction, which = 3)
#Cook's Distance plot
plot(fit1_interaction, which = 4)


#With outliers for summary stats
housePrice2 = housePrice %>%
  filter(Neighborhood %in% c('NAmes','BrkSide','Edwards'))
housePrice2

fit1_outliers = lm(SalePrice ~ GrLivArea*Neighborhood, data = housePrice2)
summary(fit1_outliers)
AIC(fit1_outliers)


###----------------------------------------- ANALYSIS 2 ---------------------------------------------------------------------------###

###Simple Linear Regression-----------------------------------------------------

#Set the response variable and test variables
response_var = "SalePrice"
predictors = setdiff(names(housePrice), response_var)

# Initialize an empty data frame to store model results
model_results = data.frame(
  Predictor = character(),
  R_Squared = numeric(),
  RMSE = numeric(),
  AIC = numeric(),
  stringsAsFactors = FALSE
)

#Loop through each predictor and run a regression
for (predictor in predictors) {
  
  #Dynamic formula
  formula = as.formula(paste(response_var, "~", predictor))
  
  #Model
  model = lm(formula, data = housePrice)
  model_summary = summary(model)
  r_squared = model_summary$r.squared
  aic_value = AIC(model)
 
  #Find RMSe
  predictions = predict(model, newdata = housePrice)
  rmse_value = rmse(housePrice[[response_var]], predictions)
  
  #Add results to data frame
  model_results = model_results %>%
    add_row(Predictor = predictor, 
            R_Squared = r_squared, 
            RMSE = rmse_value, 
            AIC = aic_value)
}

#Sort by lowest RMSE
best_model = model_results %>%
  arrange((RMSE)) %>%
  head(3)
print(best_model)

##Input best from above into plots and model below
#Linear assumption plot
ggplot(data = housePrice, aes(x = OverallQual, y = SalePrice)) + geom_point(color = "blue") + ggtitle("Sales Price vs. Overall Quality of Property") + xlab("Overall Quality") + ylab("Sales Price ($)") +
  geom_smooth(method = "lm", formula = y ~ x + I(x^2), color = "red", se = TRUE)


#Fit the best model to the data w/o parabolic
best_final_noquad = lm(SalePrice ~ OverallQual, data = housePrice)
summary(best_final_noquad)
AIC(best_final_noquad)
confint(best_final_noquad)

#Residuals
plot(best_final_noquad, which = 1)
#Q-Q plot
plot(best_final_noquad, which = 2)
#Scale-Location plot
plot(best_final_noquad, which = 3)
#Cook's Distance plot
plot(best_final_noquad, which = 4)

#Fit the best model to the data w parabolic term
best_final_model = lm(SalePrice ~ OverallQual + I(OverallQual^2), data = housePrice)
summary(best_final_model)
AIC(best_final_model)
confint(best_final_model)

#Generate diagnostic plots
par(mfrow = c(2, 2))  
#Residuals
plot(best_final_model, which = 1)
#Q-Q plot
plot(best_final_model, which = 2)
#Scale-Location plot
plot(best_final_model, which = 3)
# Cook's Distance plot
plot(best_final_model, which = 4)




#Predict Test Data Sales Price
SLR_predict = predict(customMLR, newdata = testData)
SLR_results = data.frame(Id = testData$Id, SalePrice = SLR_predict)
head(SLR_results)
write.csv(SLR_results, "C:/Users/blake.armstrong/OneDrive - Vickery Energy/Desktop/MSDS/DS-6371 Stats/Final Project/SLR_Predictions.csv", row.names = FALSE)


###Multiple Linear Regression---------------------------------------------------
#Linear assumption plot GrLivArea
pairs(housePrice_numeric[, c("SalePrice", "GrLivArea", "OverallQual")],
      main = "Pairwise Scatterplots")


#Linear assumption plot Full Bath
ggplot(data = housePrice, aes(x = FullBath, y = SalePrice)) + geom_point(color = "blue") + ggtitle("Sales Price vs. Full Bathrooms") + xlab("Number of Full Baths") + ylab("Sales Price ($)")

#Take out same outliers from GrLivArea same as Analysis 1
housePriceMLR = housePrice %>%
  filter(GrLivArea < 3500)
housePriceMLR


MLR_model = lm(SalePrice ~ GrLivArea + FullBath, data = housePriceMLR)
summary(MLR_model)
AIC(MLR_model)
confint(MLR_model)

#Generate diagnostic plots
par(mfrow = c(2, 2))  
#Residuals
plot(MLR_model, which = 1)
#Q-Q plot
plot(MLR_model, which = 2)
#Scale-Location plot
plot(MLR_model, which = 3)
# Cook's Distance plot
plot(MLR_model, which = 4)


#Predict Test Data Sales Price
MLR_predict = predict(MLR_model, newdata = testData)
MLR_results = data.frame(Id = testData$Id, SalePrice = MLR_predict)
head(MLR_results)
write.csv(MLR_results, "C:/Users/blake.armstrong/OneDrive - Vickery Energy/Desktop/MSDS/DS-6371 Stats/Final Project/MLR_Predictions.csv", row.names = FALSE)



###Custom Multiple Linear Regression--------------------------------------------
housePrice_numeric = housePrice %>%
  select_if(~ !is.character(.)) %>%
  filter(GrLivArea < 4000)
str(housePrice_numeric)



#Fit by each columns
autofit <- lm(SalePrice ~ ., data=housePrice_numeric)
str(housePrice)

#Forward
forward_auto = ols_step_forward_p(autofit, penter = 0.05, details = FALSE)
summary(forward_auto)

#Backward
backward_auto = ols_step_backward_p(autofit, prem = 0.05, details = TRUE)
summary(backward_auto)

#Stepwise
stepwise_auto = ols_step_both_p(autofit, penter = 0.05, prem = 0.05, details = TRUE)
summary(stepwise_auto)


#Take Top 2 continuous from SLR in Analysis 2
customMLR = lm(SalePrice ~ OverallQual + I(OverallQual^2) + GrLivArea , data=housePrice_numeric)
summary(customMLR)
confint(customMLR)
AIC(customMLR)


#Linear assumption plot
ggplot(data = housePrice_numeric, aes(x=GrLivArea, y= SalePrice, color = OverallQual))+geom_point()+ggtitle("Sales Price vs. Living Area (SqFt) by Overall Qual")+xlab("Living Area (SqFt)") + ylab("Sales Price ($)")

housePrice_numeric$Predicted = predict(customMLR)
plot_ly(housePrice_numeric, x = ~OverallQual, y = ~GrLivArea, z = ~SalePrice,
        type = "scatter3d", mode = "markers", marker = list(color = 'blue')) %>%
  add_trace(z = ~Predicted, type = "mesh3d", opacity = 0.5) %>%
  layout(title = "SalePrice ~ OverallQual + GrLivArea (MLR Fit)",
         scene = list(
           xaxis = list(title = "OverallQual"),
           yaxis = list(title = "GrLivArea"),
           zaxis = list(title = "SalePrice")
         ))

#Generate diagnostic plots
par(mfrow = c(2, 2))  
#Residuals
plot(customMLR, which = 1)
#Q-Q plot
plot(customMLR, which = 2)
#Scale-Location plot
plot(customMLR, which = 3)
# Cook's Distance plot
plot(customMLR, which = 4)

#Predict Test Data Sales Price
customMLR_predict = predict(customMLR, newdata = testData)
customMLR_results = data.frame(Id = testData$Id, SalePrice = customMLR_predict)
head(customMLR_results)
write.csv(customMLR_results, "C:/Users/blake.armstrong/OneDrive - Vickery Energy/Desktop/MSDS/DS-6371 Stats/Final Project/customMLR_Predictions.csv", row.names = FALSE)
