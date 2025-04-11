PROC IMPORT DATAFILE="/home/user#/Statisical Foundations/train.csv"
	OUT = housing
	dBMS=CSV
	replace;
	getnames=YES;
RUN;

data house1;
  set housing;
  where (Neighborhood = 'Edwards' or Neighborhood = 'BrkSide' or Neighborhood = 'NAmes') and 
  GrLivArea < 3500;
run;

data house2;
  set housing;
  where (Neighborhood = 'Edwards' or Neighborhood = 'BrkSide' or Neighborhood = 'NAmes');
run;


proc glm data=house1;
   class Neighborhood;  
   model SalePrice = GrLivArea | Neighborhood;
run;



proc glmselect data=house1;
   class Neighborhood; 
   model SalePrice = GrLivArea | Neighborhood / 
         selection=forward(stop=CV) 
         cvmethod=Random(380)  
         stats=adjrsq;    
run;

/*With outliers*/
proc glmselect data=house2;
   class Neighborhood;  
   model SalePrice = GrLivArea | Neighborhood / 
         selection=forward(stop=CV) 
         cvmethod=Random(380) 
         stats=adjrsq;  
run;


/*SLR*/
data housePrice;
  set housing;
  where GrLivArea < 4000;
  OverallQual_sq = OverallQual**2;
run;

proc glm data=housePrice;
  model SalePrice = OverallQual OverallQual_sq;
run;

proc glmselect data=housePrice;
   model SalePrice = OverallQual OverallQual_sq /
         selection=forward(stop=cv)
         cvmethod=random(5)  
         stats=all;       
run;


/*MLR*/
proc glmselect data=housePrice;
   model SalePrice = GrLivArea FullBath /
         selection=forward(stop=cv)
         cvmethod=random(5)  
         stats=all;       
run;


/*Custom MLR*/
proc glmselect data=housePrice;
   model SalePrice = OverallQual OverallQual_sq GrLivArea /
         selection=forward(stop=cv)
         cvmethod=random(5)  
         stats=all cvdetails;       
run;
